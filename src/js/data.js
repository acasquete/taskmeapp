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

    function stopListen() {
        console.debug('stop listen #' + sharedCanvasId);
        if (sharedCanvasId!='') {
            stopListeningToRealtimeDatabase(`s_${sharedCanvasId}`);
            sharedCanvasId = '';
        }
    }

    async function saveToFirestore(collectionPath, docId, data) {
        try {
            await db.collection(collectionPath).doc(docId).set(data);
            console.debug(`${collectionPath}/${docId} saved`);
        } catch (error) {
            console.error(error);
        }
    }

    function getDocId(type, id) {
        const prefix = type === 'dashboards' ? 'd' : 'c';
        return `${prefix}${id}`;
    }
    
    async function processQueue() {
        console.debug('process queue');
        lastRequestTime = Date.now();

        Object.values(queue).forEach(async request =>  {

            const { type, id, data } = request;
            let collectionPath;
            let docId;

            if (data.sharedCanvasId) {
                collectionPath = `shared`;
                docId = data.sharedCanvasId;
                await saveToFirestore(collectionPath, docId, data);
                data.content = '{"shared":true}';
            }
             
            collectionPath =  `users/${userId}/${type}`;
            docId = getDocId(type, id);
            await saveToFirestore(collectionPath, docId, data);

        });

        queue = {}; 
    }

    function addToQueue(type, id, data, force) {
        if (!userId) {
            return null;
        }

        queue[type] = { type, id, data };
        const currentTime = Date.now();

        if (force) lastRequestTime = 0;

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        if (currentTime - lastRequestTime >= SAVE_INTERVAL) {
            processQueue();
        } else {
            timeoutId = setTimeout(processQueue, SAVE_INTERVAL - (currentTime - lastRequestTime));
        }
    }

    function saveCanvas(id, canvasData, force) {
        if (!userId) {
           return null;
        }
        addToQueue('canvas', id, canvasData, force);
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

    async function fetchWithRetry(path, id, retries = 3, backoff = 500) {
        for (let i = 0; i < retries; i++) {
            try {
                const result = await fetchFirestoreDocument(path, id);
                if (result !== null) {
                    return result; 
                }
                console.log(`null in attempt ${i + 1} for ${path}/${id}, retrying...`);
            } catch (error) {
                console.error(`error in attempt ${i + 1} for ${path}/${id}:`, error);
            }
            
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, backoff));
                backoff *= 2; 
            }
        }
    
        return null;
    }

    async function getCanvas(id, sharedId) {
        if (!userId) {
            if (sharedId!='') { 
                Notifications.showAppNotification('You need to log in to access a shared dashboard', 'regular');
            }
            return null;
        }

        if (sharedCanvasId != '') {
            console.debug(`stop listening ${sharedCanvasId}`);
            stopListeningToRealtimeDatabase(`s_${sharedCanvasId}`);
        }

        if (sharedId!='') {
            console.debug ('fetch shared document');
            sharedCanvasId = sharedId;
            let result = await fetchWithRetry(`shared`, `${sharedId}`);

            if (result != null && result.sharedCanvasId) {
                await listenSharedCanvas (result, sharedId, externalId);
            }
            return result;
        } else {
            console.debug ('fetch private document');
            let result = await fetchWithRetry(`users/${userId}/canvas`, `c${id}`);
            
            if (result != null && result.sharedCanvasId) {
                console.debug ('fetch shared document');
                result = await fetchWithRetry(`shared`, `${result.sharedCanvasId}`);

                await listenSharedCanvas (result, sharedId, externalId);
            }

            return result;
        }
    }

    async function listenSharedCanvas(result, sharedId, externalId) {
       
        console.debug(`listed shared canvas ${sharedCanvasId} ${result.sharedCanvasId}`);

        sharedCanvasId = result.sharedCanvasId;
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

    function sendCanvasObject(data, force) {

        if (sharedCanvasId=='') return;
        
        console.debug (data);

        const currentTime = Date.now();
        
        if (force || currentTime - lastEventTime > throttleDelay) {
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
        isLogged: isLogged,
        stopListen: stopListen
    };
})();

window.Data = Data;