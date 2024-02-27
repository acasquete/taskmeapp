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

let boardGUID = '';

document.addEventListener('DOMContentLoaded', async function() {

    var params = new URLSearchParams(window.location.search);

    boardGUID = params.get('sid') ?? '';

    Notifications.init();
    MenuController.init();
    Pomodoro.init(); 
    await Sketch.init();

    const googleToken = localStorage.getItem('googleToken');

    if (googleToken && !isTokenExpired(googleToken)) {
        console.debug('auth token');
        await signInWithFirebase(googleToken);
    } else {
        console.debug('no auth token');
        Sketch.loadBoard(boardGUID);
        localStorage.removeItem('googleToken');
    }
    
    document.body.style.display = 'block';
});


let isSigned = false;

async function onSignIn(response) {
    console.debug('issigned: ' +isSigned);
    if (isSigned) return;

    const jwt = response.credential;
    localStorage.setItem('googleToken', jwt);
    await signInWithFirebase(jwt);
}

window.onSignIn = onSignIn;

async function signInWithFirebase(googleToken) {
    
    if (isTokenExpired(googleToken)) {
        console.debug('token expired');
        localStorage.removeItem('googleToken');
        return;
    }

    const credential = firebase.auth.GoogleAuthProvider.credential(googleToken);

    try {
        let result = await firebase.auth().signInWithCredential(credential);

        Data.setUserId(result.user.uid);
        await Sketch.loadBoard(boardGUID);

        var days = 7;

        var f = new Date();
        f.setTime(f.getTime() + (days * 24 * 60 * 60 * 1000));
        var exp = "expires=" + f.toUTCString();
        document.cookie = "sid=gt;" + exp + ";path=/";

        isSigned = true;

        hideStatusBarIcon();
    }
    catch(error)
    {
        console.error("Authentication Error Firebase:", error);
        showStatusBarIcon();
    }
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
