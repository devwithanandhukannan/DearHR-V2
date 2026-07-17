import admin from 'firebase-admin';
import path from 'path';

// Locate the credential file at the root of your backend project directory execution scope
const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');

try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('FCM Administration Service Account credentials mounted successfully.');
  }
} catch (error) {
  console.error('Firebase Admin initialization failure context:', error);
}

export const fcm: any = admin.messaging();
export default admin;