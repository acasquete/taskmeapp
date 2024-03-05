/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import axios from "axios";

interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    refresh_token?: string;
}

exports.refreshAccessToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated",
            "The function must be called while authenticated.");
    }

    const {RefreshToken}= data;

    const ClientId = "TU_CLIENT_ID";
    const ClientSecret = "TU_CLIENT_SECRET";
    const GrantType = "refresh_token";

    const params = new URLSearchParams();
    params.append("client_id", ClientId);
    params.append("client_secret", ClientSecret);
    params.append("refresh_token", RefreshToken);
    params.append("grant_type", GrantType);

    try {
        const response = await axios.post<TokenResponse>("https://oauth2.googleapis.com/token", params, {
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
        });

        return {newAccessToken: response.data.access_token};
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw new functions.https.HttpsError("internal",
            "Failed to refresh access token");
    }
});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
