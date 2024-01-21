const Data = (function () {
    "use strict";

    var userId = null;

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

    function setUserId(newUserId) {
        userId = newUserId;
    }
    
    function getActiveDashboard() {
        return db.collection("dashboards").doc("activeDashboard").get().then(doc => {
            return doc.exists ? doc.data().id : 1;
        });
    }

    function saveActiveDashboard(id) {
        return db.collection("dashboards").doc("activeDashboard").set({ id: id });
    }

    let lastSavedTime = 0;
    
    function saveDashboard(id, dashboard) {
        if (!userId) {
            return null;
        }

        const currentTime = Date.now(); 
        const timeDifference = currentTime - lastSavedTime; 
    
        if (timeDifference < 3000) { 
            return null;
        }
    
        lastSavedTime = currentTime; // Actualizar la última vez que se guardó
    
        return db.collection("users").doc(userId).collection("dashboards").doc("dashboard" + id).set(dashboard)
        .then(() => {
            console.log(`dashboard #${id} saved`);
        })
        .catch((error) => {
            console.error(error);
        });
    }

    function convertNestedArrayForFirestore(nestedArray) {
        return nestedArray.map(subArray => JSON.stringify(subArray));
    }

    function saveCanvas(id, canvasData) {
        if (!userId) {
            return null;
        }

        let firestoreFormat = {
            colorIndex: canvasData.colorIndex,
            paths:  convertNestedArrayForFirestore(canvasData.paths)
        };

        return db.collection("users").doc(userId).collection("canvas").doc("canvas" + id).set(firestoreFormat)
        .then(() => {
            console.log(`canvas #${id} saved`);
        })
        .catch((error) => {
            console.error(error);
        });
    }

    function getDashboard(id) {
        if (!userId) {
            return null;
        }
    
        return db.collection("users").doc(userId).collection("dashboards").doc("dashboard" + id).get()
        .then((doc) => {
            if (doc.exists) {
                return doc.data();
            } else {
                return null; 
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
    }

    function revertFirestoreDataToNestedArray(data) {
        return data.map(subArrayString => JSON.parse(subArrayString));
    }

    function getCanvas(id) {
        if (!userId) {
            return null;
        }
    
        return db.collection("users").doc(userId).collection("canvas").doc("canvas" + id).get()
        .then((doc) => {
            if (doc.exists) {
                let data = doc.data(); doc.data();
                data.paths = revertFirestoreDataToNestedArray(data.paths);
                return data;
            } else {
                return null; 
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
    }

    return {
        getActiveDashboard: getActiveDashboard,
        saveActiveDashboard: saveActiveDashboard,
        getDashboard: getDashboard,
        getCanvas: getCanvas,
        saveDashboard: saveDashboard,
        saveCanvas: saveCanvas,
        setUserId: setUserId,
        onSignIn: onSignIn
    };
})();
