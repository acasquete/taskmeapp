/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import axios from "axios";

interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    refresh_token?: string;
}

export const refreshAccessToken = onRequest(async (request, response) => {
    logger.info("Hello logs!", {structuredData: true});

    const { RefreshToken } = request.body; 

    const ClientId = "YOUR_CLIENT_ID"; 
    const ClientSecret = "YOUR_CLIENT_SECRET"; 
    const GrantType = "refresh_token";

    const params = new URLSearchParams();
    params.append("client_id", ClientId);
    params.append("client_secret", ClientSecret);
    params.append("refresh_token", RefreshToken);
    params.append("grant_type", GrantType);

    try {
        const tokenResponse = await axios.post<TokenResponse>("https://oauth2.googleapis.com/token", params, {
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
        });

        response.json({newAccessToken: tokenResponse.data.access_token});
    } catch (error) {
        logger.error("Error refreshing access token:", error);
        response.status(500).send("Failed to refresh access token");
    }
});

