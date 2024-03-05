import '../css/taskboard.scss';
import '../css/menu.scss';
import '../css/pomodoro.scss';
import '../css/fa/css/fontawesome.min.css';
import '../css/fa/css/brands.min.css';
import '../css/fa/css/solid.min.css';
import './ConfigService';
import '../js/menu.js';
import '../js/notificationsweb.js';
import '../js/sketch.js';
import '../js/data.js';

export class AppInitializer {
    private boardGUID: string = '';
    private isSigned: boolean = false;

    constructor() {
        document.addEventListener('DOMContentLoaded', () => this.onDomContentLoaded());
    }

    private async onDomContentLoaded(): Promise<void> {
        const params = new URLSearchParams(window.location.search);
        this.boardGUID = params.get('sid') ?? '';

        Notifications.init();
        MenuController.init();
        Pomodoro.init();
        await Sketch.init();

        const googleToken = localStorage.getItem('googleToken');

        if (googleToken && !this.isTokenExpired(googleToken)) {
            console.debug('auth token');
            await this.signInWithFirebase(googleToken);
        } else {
            console.debug('no auth token');
            Sketch.loadBoard(this.boardGUID);
            localStorage.removeItem('googleToken');
        }

        document.body.style.display = 'block';
    }

    public async onSignIn(response: any): Promise<void> {
        console.debug('issigned: ' + this.isSigned);
        if (this.isSigned) return;

        const jwt = response.credential;
        localStorage.setItem('googleToken', jwt);
        await this.signInWithFirebase(jwt);
    }

    async function refreshAccessToken(refreshToken: string): Promise<void> {
        const client_id = 'TU_CLIENT_ID'; // Proporcionado por la Google Cloud Console
        const client_secret = 'TU_CLIENT_SECRET'; // Proporcionado por la Google Cloud Console
        const grant_type = 'refresh_token';
    
        const tokenEndpoint = 'https://oauth2.googleapis.com/token';
        const params = new URLSearchParams();
        params.append('client_id', client_id);
        params.append('client_secret', client_secret);
        params.append('refresh_token', refreshToken);
        params.append('grant_type', grant_type);
    
        try {
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
    
            if (!response.ok) {
                throw new Error(`Token refresh failed with status: ${response.status}`);
            }
    
            const data: GoogleTokenResponse = await response.json();
            const newAccessToken = data.access_token;
            // Aquí puedes manejar el nuevo token de acceso, por ejemplo, almacenándolo para su uso posterior
            console.log('New access token:', newAccessToken);
    
            if (data.refresh_token) {
                console.log('New refresh token:', data.refresh_token);
            }
    
        } catch (error) {
            console.error('Error refreshing access token:', error);
        }
    }

    private async signInWithFirebase(googleToken: string): Promise<void> {
        if (this.isTokenExpired(googleToken)) {
            console.debug('token expired');
            localStorage.removeItem('googleToken');
            return;
        }

        const credential = firebase.auth.GoogleAuthProvider.credential(googleToken);

        try {
            const result = await firebase.auth().signInWithCredential(credential);

            Data.setUserId(result.user.uid);
            await Sketch.loadBoard(this.boardGUID);

            const days = 7;
            const futureDate = new Date();
            futureDate.setTime(futureDate.getTime() + (days * 24 * 60 * 60 * 1000));
            const exp = "expires=" + futureDate.toUTCString();
            document.cookie = "sid=gt;" + exp + ";path=/";

            this.isSigned = true;
            this.hideStatusBarIcon();
        } catch (error) {
            console.error("Authentication Error Firebase:", error);
            this.showStatusBarIcon();
        }
    }

    private showStatusBarIcon(): void {
        document.getElementById("localmode")!.style.display = "block";
    }

    private hideStatusBarIcon(): void {
        document.getElementById("localmode")!.style.display = "none";
    }

    private isTokenExpired(token: string): boolean {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    }
}
