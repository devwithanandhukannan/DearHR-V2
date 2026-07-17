import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.ts';
import { ROLES } from '../constants/roles.ts';
import { PermissionHelper } from '../utils/permissions.ts';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_access_secret';

const extractToken = (req: Request): string | undefined => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.cookies?.accessToken;
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        globalRoles: number;
        mobileNumber?: string | undefined;
        email?: string | undefined;
        jobSeekerProfileId?: string | undefined;
        fullName?: string | undefined;
      } | undefined;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Session unauthorized or expired' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; globalRoles: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        mobileNumber: true,
        globalRoles: true,
        isVerified: true,
        jobSeekerProfile: { select: { email: true } }
      },
    });

    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: 'User not found or not verified' });
    }

    req.user = {
      userId: user.id,
      globalRoles: user.globalRoles,
      mobileNumber: user.mobileNumber || undefined,
      email: user.jobSeekerProfile?.email || undefined
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }
};

export const requireJobSeeker = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  if (!PermissionHelper.hasRole(req.user.globalRoles, ROLES.JOB_SEEKER)) {
    return res.status(403).json({ success: false, message: 'Access Denied: Job Seeker role required' });
  }
  return next();
};

export const requirePlatformAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  if (!PermissionHelper.isPlatformAdmin(req.user.globalRoles)) {
    return res.status(403).json({ success: false, message: 'Access Denied: Platform Admin role required' });
  }
  return next();
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; globalRoles: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        mobileNumber: true,
        globalRoles: true,
        isVerified: true,
        jobSeekerProfile: { select: { id: true, email: true, fullName: true } }
      },
    });

    if (user && user.isVerified && user.jobSeekerProfile) {
      req.user = {
        userId: user.id,
        globalRoles: user.globalRoles,
        mobileNumber: user.mobileNumber || undefined,
        email: user.jobSeekerProfile.email,
        jobSeekerProfileId: user.jobSeekerProfile.id,
        fullName: user.jobSeekerProfile.fullName
      };
    }
  } catch (error) {
    req.user = undefined;
  }

  return next();
};

export const requireAuth = authenticateToken;