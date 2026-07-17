import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.ts';
import { issueSessionCookies } from '../utils/cookie.ts';

export const refreshSessionToken = async (req: Request, res: Response) => {
  try {
    const currentRefreshToken = req.cookies?.refreshToken;

    if (!currentRefreshToken) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret';

    jwt.verify(currentRefreshToken, REFRESH_TOKEN_SECRET, async (err: any, decoded: any) => {
      if (err) {
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
      }
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'User context not found.' });
      }

      const accessToken = issueSessionCookies(res, { userId: user.id, globalRoles: user.globalRoles });

      return res.status(200).json({ success: true, message: 'Session successfully extended.', accessToken });
    });
  } catch (error) {
    console.error('refreshSessionToken error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};