import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.ts';
import { generateOTP } from '../utils/generateOtp.ts';
import { issueSessionCookies } from '../utils/cookie.ts';
import { ROLES } from '../constants/roles.ts';
import { PermissionHelper } from '../utils/permissions.ts';

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, purpose } = req.body;
    if (!mobileNumber)
      return res.status(400).json({ success: false, message: 'Mobile number required.' });
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const existingUser = await prisma.user.findUnique({ where: { mobileNumber } });

    await prisma.otp.create({
      data: {
        mobileNumber, otpHash, expiresAt,
        purpose: purpose || 'authentication',
        ...(existingUser ? { userId: existingUser.id } : {}),
      },
    });

    console.log(`📱 OTP for ${mobileNumber}: [ ${otp} ]`);
    return res.status(200).json({ success: true, message: 'OTP sent.' });
  } catch (error) {
    console.error('sendOtp error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP required.' });
    }

    // 1. Fetch latest OTP record
    const latestOtp = await prisma.otp.findFirst({
      where: { mobileNumber },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp || latestOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
    }

    // 2. Cryptographic verification
    const isValid = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // 3. Find or create the user entity
    let user = await prisma.user.findUnique({ 
      where: { mobileNumber },
      include: { jobSeekerProfile: true } 
    });

    if (!user) {
      user = await prisma.user.create({
        data: { mobileNumber, isVerified: true, globalRoles: ROLES.JOB_SEEKER },
        include: { jobSeekerProfile: true }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
        include: { jobSeekerProfile: true }
      });
    }

    // 4. Trace-back OTP correlation
    if (!latestOtp.userId) {
      await prisma.otp.update({ where: { id: latestOtp.id }, data: { userId: user.id } });
    }

    // 5. Issue secure state variables
    const accessToken = issueSessionCookies(res, { userId: user.id, globalRoles: user.globalRoles });

    // 6. Check if Profile rules are met
    const profile = user.jobSeekerProfile;
    const hasEmail = !!profile?.email;
    const hasFullName = !!(profile?.fullName && profile.fullName !== 'Candidate');

    return res.status(200).json({ 
      success: true, 
      message: 'Login successful.', 
      accessToken,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        globalRoles: user.globalRoles,
        hasEmail,      
        hasFullName,
        email: profile?.email || '',
        fullName: profile?.fullName === 'Candidate' ? '' : (profile?.fullName || ''),
        profilePhotoUrl: profile?.profilePhotoUrl || null
      }
    });

  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const checkMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { jobSeekerProfile: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const profile = user.jobSeekerProfile;
    const hasEmail = !!profile?.email;
    const hasFullName = !!(profile?.fullName && profile.fullName !== 'Candidate');

    return res.status(200).json({ 
      success: true,
      accessToken: req.token,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber || '',
        email: user.email || profile?.email || '',
        globalRoles: user.globalRoles,
        hasEmail,      
        hasFullName,
        fullName: profile?.fullName === 'Candidate' ? '' : (profile?.fullName || ''),
        profilePhotoUrl: profile?.profilePhotoUrl || null
      }
    });
    
  } catch (error) {
    console.error('checkMe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to authenticate.' });
  }
};

export const logoutUser = (_req: Request, res: Response) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  return res.status(200).json({ success: true, message: 'Logged out.' });
};

export const checkEmailExists = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required.' });
    }
    
    const profile = await prisma.jobSeekerProfile.findFirst({
      where: { email }
    });
    
    if (profile) {
      return res.status(200).json({ success: true, exists: true, message: 'Email already exists.' });
    }
    
    return res.status(200).json({ success: true, exists: false });
  } catch (error) {
    console.error('checkEmailExists error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const adminRegister = async (req: Request, res: Response) => {
  try {
    const { email, password, mobileNumber } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: passwordHash,
        mobileNumber: mobileNumber || null,
        globalRoles: ROLES.PLATFORM_ADMIN,
        isVerified: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully.',
      user: {
        id: user.id,
        email: user.email,
        globalRoles: user.globalRoles,
      },
    });
  } catch (error) {
    console.error('adminRegister error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!PermissionHelper.isPlatformAdmin(user.globalRoles)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin privilege required.' });
    }

    const accessToken = issueSessionCookies(res, { userId: user.id, globalRoles: user.globalRoles });

    return res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        globalRoles: user.globalRoles,
      },
    });
  } catch (error) {
    console.error('adminLogin error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const totalJobSeekers = await prisma.jobSeekerProfile.count();
    const totalResumes = await prisma.resume.count();
    
    return res.status(200).json({
      success: true,
      summary: {
        totalJobSeekers,
        totalResumes,
        averageResumes: totalJobSeekers > 0 ? (totalResumes / totalJobSeekers).toFixed(1) : '0.0'
      }
    });
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const getAdminCandidates = async (req: Request, res: Response) => {
  try {
    const candidates = await prisma.jobSeekerProfile.findMany({
      include: {
        resumes: {
          select: { id: true, name: true, atsScore: true, filePath: true, createdAt: true }
        },
        skills: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.status(200).json({ success: true, data: candidates });
  } catch (error) {
    console.error('getAdminCandidates error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const deleteAdminCandidate = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { id },
      select: { userId: true }
    });
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Candidate profile not found.' });
    }
    
    await prisma.user.delete({
      where: { id: profile.userId }
    });
    
    return res.status(200).json({ success: true, message: 'Candidate successfully deleted.' });
  } catch (error) {
    console.error('deleteAdminCandidate error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};