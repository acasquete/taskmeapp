document.addEventListener('DOMContentLoaded', function() {

    const googleToken = localStorage.getItem('googleToken');
    if (googleToken && !isTokenExpired(googleToken)) {
        signInWithFirebase(googleToken);
    } else {
        localStorage.removeItem('googleToken');
    }
    
    Pomodoro.init();
});


let isSigned = false;

function onSignIn(response) {
    if (isSigned) return;

    const jwt = response.credential;
    localStorage.setItem('googleToken', jwt);

    signInWithFirebase(jwt);
}

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
            Taskboard.init();
            isSigned = true;
        }).catch((error) => {
            console.error("Error en la autenticación con Firebase:", error);
        });
}

function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
}

