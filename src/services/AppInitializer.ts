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

        microsoftTeams.initialize();

        microsoftTeams.getContext(function(context) {
            var userId = context.userObjectId; 
            var userName = context.userPrincipalName; 
            var userDisplayName = context.userDisplayName; 
            var channelId = context.channelId;
            var channelName = context.channelName;
            var teamId = context.teamId;

            // document.getElementById('teamsInfo').innerHTML = `
            //     Info
            //     <p>User ID: ${userId}</p>
            //     <p>User Name: ${userName}</p>
            //     <p>Display Name: ${userDisplayName}</p>
            //     <p>Channel ID: ${channelId}</p>
            //     <p>Channel Name: ${channelName}</p>
            //     <p>Team ID: ${teamId}</p>
            // `;

            Data.setUserId(userId);
        });
        
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
