import '../css/taskboard.css';
import '../css/menu.css';
import '../css/pomodoro.css';
import '../css/fa/css/fontawesome.min.css';
import '../css/fa/css/brands.min.css';
import '../css/fa/css/solid.min.css';
import '../index.ts';
import '../services/ConfigService.ts';
import './taskboard.js';
import './utils.js';
import './pomodoro.js';
import './menu.js';
import './notificationsweb.js';
import './sketch.js';
import './data.js';

document.addEventListener('DOMContentLoaded', function() {

    var params = new URLSearchParams(window.location.search);

    var sharedId = params.get('sid');
    
    Taskboard.init(sharedId);
    Pomodoro.init();

    const googleToken = localStorage.getItem('googleToken');
    if (googleToken && !isTokenExpired(googleToken)) {
        signInWithFirebase(googleToken);
    } else {
        localStorage.removeItem('googleToken');
    }
    
});


let isSigned = false;

function onSignIn(response) {
    if (isSigned) return;

    const jwt = response.credential;
    localStorage.setItem('googleToken', jwt);

    signInWithFirebase(jwt);
}

window.onSignIn = onSignIn;

function signInWithFirebase(googleToken) {
    if (isTokenExpired(googleToken)) {
        localStorage.removeItem('googleToken');
        return;
    }

    const credential = firebase.auth.GoogleAuthProvider.credential(googleToken);

    firebase.auth().signInWithCredential(credential)
        .then((result) => {
            const user = result.user;
            Data.setUserId(user.uid);
            Taskboard.loadCurrentDashboard();
            isSigned = true;
            hideStatusBarIcon();
        }).catch((error) => {
            console.error("Authentication Error Firebase:", error);
            showStatusBarIcon();
        });
}

function showStatusBarIcon() {
    $("#localmode").show();
}

function hideStatusBarIcon() {
    $("#localmode").hide();
}

function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
}

