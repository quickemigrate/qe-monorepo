import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount: admin.ServiceAccount;

try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
  serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
} catch (e) {
  console.error('Error parseando FIREBASE_SERVICE_ACCOUNT:', e);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
