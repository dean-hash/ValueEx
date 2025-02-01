import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { ENV_CONFIG } from '../../config/env.production';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: ENV_CONFIG.FIREBASE.PROJECT_ID,
            privateKey: ENV_CONFIG.FIREBASE.PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: ENV_CONFIG.FIREBASE.CLIENT_EMAIL,
        }),
        databaseURL: ENV_CONFIG.FIREBASE.DATABASE_URL
    });
}

export const db = admin.database();
export { admin, functions };
