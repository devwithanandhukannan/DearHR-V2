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
  deleteAdminCandidate
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

export default router;