const Data = (function () {
    "use strict";

    var userId = null;
    var lastRequestTime = 0;
    var queue = {};
    var timeoutId = null;
    const SAVE_INTERVAL = 3000;

    const firebaseConfig = {
        apiKey: "AIzaSyAolhu6a8_LPL1UkVlmJxCYVAjylm-XGUI",
        authDomain: "taskmeapp.firebaseapp.com",
        projectId: "taskmeapp",
        storageBucket: "taskmeapp.appspot.com",
        messagingSenderId: "368293194406",
        appId: "1:368293194406:web:57077c53432ff205362267",
        measurementId: "G-T0P2XSLXT5"
    };
    
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();

    function saveToFirestore(collectionPath, docId, data) {
        return db.collection(collectionPath).doc(docId).set(data)
            .then(() => console.log(`${docId} saved`))
            .catch((error) => console.error(error));
    }

    function getDocId(type, id) {
        const prefix = type === 'dashboards' ? 'd' : 'c';
        return `${prefix}${id}`;
    }

    function processQueue() {
        lastRequestTime = Date.now();

        Object.values(queue).forEach(request => {
            const { type, id, data } = request;
            const collectionPath = `users/${userId}/${type}`;
            const docId = getDocId(type, id);
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

    function saveDashboard(id, dashboard) {
        addToQueue('dashboards', id, dashboard);
    }

    function saveCanvas(id, canvasData) {
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

    function getDashboard(id) {
        if (!userId) {
            return null;
        }

        const docId = `d${id}`;
        const collectionPath = `users/${userId}/dashboards`;
        return fetchFirestoreDocument(collectionPath, docId);
    }

    function getCanvas(id) {
        if (!userId) {
            return null;
        }

        const docId = `c${id}`;
        const collectionPath = `users/${userId}/canvas`;
        return fetchFirestoreDocument(collectionPath, docId);
    }

    function setUserId(newUserId) {
        userId = newUserId;
    }
    
    function convertNestedArrayForFirestore(nestedArray) {
        return nestedArray.map(subArray => JSON.stringify(subArray));
    }

    function revertFirestoreDataToNestedArray(data) {
        return data.map(subArrayString => JSON.parse(subArrayString));
    }

    return {
        getDashboard: getDashboard,
        getCanvas: getCanvas,
        saveDashboard: saveDashboard,
        saveCanvas: saveCanvas,
        setUserId: setUserId,
    };
})();

window.Data = Data;