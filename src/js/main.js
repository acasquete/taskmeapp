import '../css/taskboard.css';
import '../css/menu.css';
import '../css/pomodoro.css';
import '../css/fa/css/fontawesome.min.css';
import '../css/fa/css/brands.min.css';
import '../css/fa/css/solid.min.css';
import '../services/configService.ts';
import '../index.ts';
import './menu.js';
import './utils.js';
import './pomodoro.js';
import './notificationsweb.js';
import './sketch.js';
import './data.js';

let sharedId = '';

document.addEventListener('DOMContentLoaded', function() {

    var params = new URLSearchParams(window.location.search);

    sharedId = params.get('sid') ?? '';

    Notifications.init();
    MenuController.init();
    Pomodoro.init(); 
    Sketch.init(sharedId);

    const googleToken = localStorage.getItem('googleToken');
    if (googleToken && !isTokenExpired(googleToken)) {
        signInWithFirebase(googleToken);
    } else {
        console.debug('no auth token');
        
        Sketch.loadCurrentDashboard(sharedId);
        localStorage.removeItem('googleToken');
    }
    
    document.body.style.display = 'block';
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
            Sketch.loadCurrentDashboard(sharedId);
            Data.setUserId(user.uid);
            isSigned = true;
            hideStatusBarIcon();
        }).catch((error) => {
            console.error("Authentication Error Firebase:", error);
            showStatusBarIcon();
        });
}

function showStatusBarIcon() {
    document.getElementById("localmode").style.display = "block";
}

function hideStatusBarIcon() {
    document.getElementById("localmode").style.display = "none";
}

function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
}

