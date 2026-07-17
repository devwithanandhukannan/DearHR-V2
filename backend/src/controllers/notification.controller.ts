import { prisma } from '../utils/prisma.ts';
import type { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.ts';

export const saveNotificationToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { token } = req.body;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: User mapping context signature is missing.' 
      });
    }
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bad Request: FCM device registration token is required.' 
      });
    }
    const savedToken = await prisma.notificationToken.upsert({
      where: {
        token: token,
      },
      update: {
        userId: userId,
      },
      create: {
        userId: userId,
        token: token,
      },
    });

    console.log(`FCM token successfully registered for User ID: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'FCM token synchronized and saved securely.',
      data: { id: savedToken.id }
    });

  } catch (error) {
    console.error('Prisma tracking error during FCM token persistence:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error: Failed to save notification configuration.' 
    });
  }
};

export const sendNotificationToUser = async (req: Request, res: Response) => {
  try {
    const { userId, title, body, deepLinkUrl } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, error: 'userId, title, and body are required.' });
    }

    await NotificationService.sendToUser(userId, title, body, deepLinkUrl);

    return res.status(200).json({
      success: true,
      message: 'Push notification triggered successfully.',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to dispatch cloud message.',
    });
  }
};