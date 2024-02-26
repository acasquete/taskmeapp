const Data = (function () {
    "use strict";

    var userId = null;
    var publicUserId = null;
    var boardGUID = '';
    var lastRequestTime = 0;
    var queue = {};
    var timeoutId = null;
    const SAVE_INTERVAL = 3000;
    let lastEventTime = 0; 
    const throttleDelay = 100; 

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

    async function saveToFirestore(collectionPath, docId, data) {
        try {
            await db.collection(collectionPath).doc(docId).set(data, { merge: true} );
            console.debug(`${collectionPath}/${docId} saved`);
        } catch (error) {
            console.error(error);
        }
    }
    
    async function processQueue() {
        console.debug('process queue');
        lastRequestTime = Date.now();

        Object.values(queue).forEach(async request =>  {
            const { type, id, data } = request;

            switch (type) {
                case 'board':
                    await saveToFirestore(type, data.guid, data);
                    break;
                case 'user':
                    await saveToFirestore(type, id, data);
                    break;
            }
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

    function saveCanvas(index, canvasData, force) {
        if (!userId) return;

        addToQueue('board', canvasData.guid, canvasData, force);

        if (index>0) {
            let nameBoardId = `boardId${index}`;
            addToQueue('user', userId, { [nameBoardId]: canvasData.guid }, true);
        }
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

    async function getItem(object, id) {
        console.debug (`fetch private ${object} ${id}`);
        let result = await fetchWithRetry(`users/${userId}/${object}`, `c${id}`);
        return result;
    }

    async function getGUIDByIndex (index) {
        if (!userId) return;

        let result = await fetchWithRetry(`user`, `${userId}`);
        let boardId = `boardId${index}`;
        return result[boardId];
    }

    async function getCanvas(newGUID) {
        if (!userId) return;

        if (newGUID != '' && boardGUID!='') {
            console.debug(`stop listening ${boardGUID}`);
            stopListeningToRealtimeDatabase(`bs_${boardGUID}`);
            boardGUID = '';
        }

        console.debug ('fetch document');
        let result = await fetchWithRetry(`board`, `${newGUID}`);

        if (result != null && result.shared) {
            console.debug ('listening board: ' + newGUID);
            await listenSharedCanvas (newGUID);
        }
        return result;
    }

    async function listenSharedCanvas(newGUID) {
       
        console.debug(`listed shared canvas ${newGUID}`);

        boardGUID = newGUID;

        let path = `bs_${newGUID}`;
        
        console.debug(`listen ${path}`);

        listenToRealtimeDatabase(path, (data) => {

            if (data.uid != publicUserId) {
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

    function setUserId(newUserId) {
        userId = newUserId;
        publicUserId = Math.random().toString(36).substr(2, 9);
        console.debug('assigned user:' + userId);
    }

    function sendCanvasObject(data, force) {
        if (!isLogged() || boardGUID === '') return;
        
        console.debug (data);

        const currentTime = Date.now();
        
        if (force || currentTime - lastEventTime > throttleDelay) {
            lastEventTime = currentTime;
            
            let path = `bs_${boardGUID}`;
            data.uid = publicUserId;
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
        getGUIDByIndex: getGUIDByIndex
    };
})();

window.Data = Data;