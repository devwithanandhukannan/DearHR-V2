import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma.ts';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 Firebase Admin SDK successfully initialized inside NotificationService.');
    } else {
      console.error('❌ Firebase Init Error: service-account.json missing at project root.');
    }
  } catch (initError) {
    console.error('❌ Critical error during Firebase Admin bootstrap:', initError);
  }
}

export class NotificationService {
  static async sendToUser(userId: string, title: string, body: string, deepLinkUrl?: string): Promise<any> {
    try {
        console.log(`[FCM] Preparing to send notification to User ID: ${userId} with title: "${title}"`);
      const userTokens = await prisma.notificationToken.findMany({
        where: { userId: userId },
        select: { token: true }
      });

      if (!userTokens || userTokens.length === 0) {
        console.log(`[FCM] No registered device tokens found for User ID: ${userId}`);
        return null;
      }

      const registrationTokens = userTokens.map(t => t.token);

      const message: admin.messaging.MulticastMessage = {
        tokens: registrationTokens,
        notification: {
          title: title,
          body: body,
        },
      };

      if (deepLinkUrl) {
        message.webpush = {
          fcmOptions: {
            link: deepLinkUrl,
          },
        };
      }


      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[FCM] Successfully dispatched ${response.successCount} messages for User: ${userId}`);

      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            if (
              resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered'
            ) {
              const token = registrationTokens[idx];
              if (token) {
                failedTokens.push(token);
              }
            }
          }
        });

        if (failedTokens.length > 0) {
          await prisma.notificationToken.deleteMany({
            where: { token: { in: failedTokens } },
          });
          console.log(`[FCM] Cleaned up ${failedTokens.length} outdated/invalid tokens from DB.`);
        }
      }

      return response;
    } catch (error) {
      console.error('Error inside NotificationService.sendToUser:', error);
      throw error;
    }
  }
}