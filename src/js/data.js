const Data = (function () {
    "use strict";

    var userId = null;
    var externalId = null;
    var lastRequestTime = 0;
    var queue = {};
    var timeoutId = null;
    const SAVE_INTERVAL = 3000;
    var sharedCanvasId = '';

    const firebaseConfig = {
        apiKey: "AIzaSyAolhu6a8_LPL1UkVlmJxCYVAjylm-XGUI",
        authDomain: "taskmeapp.firebaseapp.com",
        projectId: "taskmeapp",
        storageBucket: "taskmeapp.appspot.com",
        messagingSenderId: "368293194406",
        appId: "1:368293194406:web:57077c53432ff205362267",
        measurementId: "G-T0P2XSLXT5",
        databaseURL: "https://taskmeapp-default-rtdb.firebaseio.com/"
    };
    
    firebase.initializeApp(firebaseConfig);
    let db = firebase.firestore();
    let realTimeDb = firebase.database();

    function saveToRealtimeDatabase(path, data) {
        realTimeDb.ref(path).set(data, error => {
            if (error) {
                console.error(error);
            }
        });
    }

    function listenToRealtimeDatabase(path, callback) {
        realTimeDb.ref(path).on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                callback(data);
            }
        }, error => {
            console.error(error);
        });
    }

    function stopListeningToRealtimeDatabase(path) {
        realTimeDb.ref(path).off('value');
    }

    function saveToFirestore(collectionPath, docId, data) {
        return db.collection(collectionPath).doc(docId).set(data)
            .then(() => { console.debug(`${collectionPath}/${docId} saved`) })
            .catch((error) => { console.error(error) } );
    }

    function getDocId(type, id) {
        const prefix = type === 'dashboards' ? 'd' : 'c';
        return `${prefix}${id}`;
    }
    
    function processQueue() {
        lastRequestTime = Date.now();

        Object.values(queue).forEach(request => {

            const { type, id, data } = request;
            let collectionPath;
            let docId;

            if (data.sharedCanvasId) {
                collectionPath = `shared`;
                docId = data.sharedCanvasId;
                saveToFirestore(collectionPath, docId, data);
                data.content = '{"shared":true}';
            }
             
            collectionPath =  `users/${userId}/${type}`;
            docId = getDocId(type, id);
            saveToFirestore(collectionPath, docId, data);

        });

        queue = {}; 
    }

    function addToQueue(type, id, data) {
        if (!userId) {
            return null;
        }

        queue[type] = { type, id, data };
        const currentTime = Date.now();

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        if (currentTime - lastRequestTime >= SAVE_INTERVAL) {
            processQueue();
        } else {
            timeoutId = setTimeout(processQueue, SAVE_INTERVAL - (currentTime - lastRequestTime));
        }
    }

    function saveCanvas(id, canvasData) {
        if (!userId) {
           return null;
        }
        addToQueue('canvas', id, canvasData);
    }

    function fetchFirestoreDocument(collectionPath, docId) {
       
        return db.collection(collectionPath).doc(docId).get()
            .then(doc => {
                if (doc.exists) {
                    return doc.data();
                } else {
                    console.warn(`Document ${docId} not found in ${collectionPath}`);
                    return null;
                }
            })
            .catch(error => {
                console.error("Error fetching document:", error);
                throw error;
            });
    }

    async function getCanvas(id, sharedId) {
        if (!userId) {
            if (sharedId!='') { 
                Notifications.showAppNotification('You need to log in to access a shared dashboard', 'regular');
            }
            return null;
        }

        if (sharedId!='') {
            console.debug ('fetch shared document');
            sharedCanvasId = sharedId;
            let result = await fetchFirestoreDocument(`shared`, `${sharedId}`);

            if (result != null && result.sharedCanvasId) {
                await listenSharedCanvas (result, sharedId, externalId);
            }
            return result;
        } else {
            console.debug ('fetch private document');
            let result = await fetchFirestoreDocument(`users/${userId}/canvas`, `c${id}`);
            
            if (result != null && result.sharedCanvasId) {
                sharedCanvasId = result.sharedCanvasId;
                
                console.debug ('fetch shared document');
                result = await fetchFirestoreDocument(`shared`, `${sharedCanvasId}`);

                await listenSharedCanvas (result, sharedId, externalId);
            }

            return result;
        }
    }

    async function listenSharedCanvas(result, sharedId, externalId) {
       
        if (sharedId != result.sharedCanvasId && sharedId != '') {
            console.debug(`stop listening ${sharedId}`);
            stopListeningToRealtimeDatabase(`s_${sharedId}`);
        }

        sharedId = result.sharedCanvasId;
        let path = `s_${sharedId}`;
        
        console.debug(`listen ${path}`);

        listenToRealtimeDatabase(path, (data) => {
            if (data.uid != externalId) {

                console.debug(data);

                switch (data.a) {
                    case 'om': // Object moving
                        Sketch.updatePositionRealTime(data);
                        break;
                    case 'cm': // Column moving
                        let colData = JSON.parse(data.d);
                        colData.forEach((canvasObj) => {
                            Sketch.updatePositionRealTime({id: 'sep'+canvasObj.i, l: (+canvasObj.l) + (+canvasObj.w)});
                            Sketch.updatePositionRealTime({id: 'col'+canvasObj.i, l: canvasObj.l, w: canvasObj.w});
                        });
                        break;
                    case 'oa': // Object added
                        Sketch.addObjectRealTime(JSON.parse(data.d));
                        break;
                    case 'do': // Delete object
                        Sketch.removeObjectRealTime(data.d);
                        break;
                    case 'tu': // Text Update
                        Sketch.updateNoteRealTime(data.id, data.d);
                        break;
                    case 'cu': // Column Text Update
                        Sketch.updateTextControlRealTime(data.id, data.d);
                        break;
                }
            }
        });
    }

    function genId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function setUserId(newUserId) {
        userId = newUserId;
        externalId = genId();
    }

    let lastEventTime = 0; 
    const throttleDelay = 100; 

    function sendCanvasObject(data) {

        if (sharedCanvasId=='') return;
        
        console.debug (data);

        const currentTime = Date.now();
        
        if (currentTime - lastEventTime > throttleDelay) {
            lastEventTime = currentTime;
            
            let path = `s_${sharedCanvasId}`;
            data.uid = externalId;

            saveToRealtimeDatabase(path, data); 
        }
    }
    
    function isLogged () {
        return userId != null;
    }

    return {
        getCanvas: getCanvas,
        saveCanvas: saveCanvas,
        setUserId: setUserId,
        sendCanvasObject: sendCanvasObject,
        isLogged: isLogged
    };
})();

window.Data = Data;