// src/routes/auth.routes.ts
import express from 'express';
import { 
  checkMe, 
  sendOtp, 
  verifyOtp, 
  logoutUser,
  checkEmailExists,
  adminLogin,
  adminRegister,
  getAdminDashboard,
  getAdminCandidates,
  deleteAdminCandidate,
  getAdminStats,
  getPlatformConfig,
  savePlatformConfig,
} from '../controllers/auth.controller.ts';
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.middleware.ts';
import { refreshSessionToken } from '../controllers/refreshtoken.controller.ts';

const router = express.Router();

// Public routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', logoutUser);
router.post('/refresh', refreshSessionToken);
router.post('/check-email', checkEmailExists);
router.post('/admin/login', adminLogin);
router.post('/admin/register', adminRegister);

// Protected routes
router.get('/me', authenticateToken, checkMe);
router.get('/admin/dashboard', authenticateToken, requirePlatformAdmin, getAdminDashboard as any);
router.get('/admin/candidates', authenticateToken, requirePlatformAdmin, getAdminCandidates as any);
router.delete('/admin/candidates/:id', authenticateToken, requirePlatformAdmin, deleteAdminCandidate as any);

// Extended admin stats + platform config
router.get('/admin/stats', authenticateToken, requirePlatformAdmin, getAdminStats as any);
router.get('/admin/config', authenticateToken, requirePlatformAdmin, getPlatformConfig as any);
router.post('/admin/config', authenticateToken, requirePlatformAdmin, savePlatformConfig as any);

export default router;