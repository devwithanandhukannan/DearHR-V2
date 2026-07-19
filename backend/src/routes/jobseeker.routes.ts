// PATH: src/routes/jobseeker.routes.ts

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  authenticateToken, 
  requireJobSeeker,
} from '../middleware/auth.middleware.ts';
import { 
  getProfile, 
  updateProfile, 
  getJobseekerDashboard,
  getSmtpConfig,
  saveSmtpConfig,
  draftEmailAndCV,
  sendEmailWithCV
} from '../controllers/profile.controller.ts';
import { upload as profileUpload } from '../utils/multer.ts';
import {
  uploadAndAnalyze,
  generateCV,
  convertResumeToHTML,
  optimizeResume,
  getKeywordSuggestions,
  getAllResumes,
  getResumeById,
  updateResume,
  restoreVersion,
  deleteResume,
  downloadResume,
  generateRegionalCV,
  scoreContentOnly,
  getInlineSuggestions,
  improveSelectedText,
  injectKeywordsForVersion,
  getMockInterviewQuestions,
  evaluateInterviewAnswerForVersion,
  generateOutreachMessageForVersion,
  getSalaryInsightsForVersion,
} from '../controllers/resume.controller.ts';
import { 
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication
} from '../controllers/application.controller.ts';
import { saveNotificationToken } from '../controllers/notification.controller.ts';
import { parseAndLoadResume } from '../controllers/resumeParser.controller.ts';
import {
  saveJobDescription,
  getJobDescription,
  getJobDescriptions,
  deleteJobDescription,
  getResumeVersions,
  getResumeVersionById,
  createResumeVersion,
  deleteResumeVersion,
  duplicateResumeVersion,
  generateCoverLetterForVersion,
  updateCoverLetter,
  analyzeJobHtml
} from '../controllers/version.controller.ts';


const router = express.Router();

// ─── AUTHENTICATED JOB SEEKER ROUTES ─────────────────────────────────────
router.use(authenticateToken);
router.use(requireJobSeeker);

// ─── PROFILE MANAGEMENT ──────────────────────────────────────────────────
router.get('/profile', getProfile as any);
router.put('/profile', profileUpload.single('profileImage'), updateProfile as any);
router.get('/dashboard', getJobseekerDashboard as any);
router.get('/profile/smtp', getSmtpConfig as any);
router.post('/profile/smtp', saveSmtpConfig as any);

// ─── RESUME PARSE — uses memoryStorage so req.file.buffer is populated ────
const parseResumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF/DOCX allowed'));
  },
});

router.post('/parse-resume', parseResumeUpload.single('resume'), parseAndLoadResume);

// ─── RESUME DISK STORAGE (for save/analyze/download flows) ───────────────
const UPLOAD_DIR = process.env.RESUME_UPLOAD_DIR ??
  path.join(process.cwd(), 'uploads/resumes');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF/DOCX allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── RESUME MANAGEMENT ───────────────────────────────────────────────────
router.post('/resumes/upload', resumeUpload.single('resume'), uploadAndAnalyze);
router.post('/resumes/generate', generateCV);
router.post('/resumes/:id/convert', convertResumeToHTML);
router.post('/resumes/:id/optimize', optimizeResume);
router.get('/resumes/:id/keywords', getKeywordSuggestions);
router.patch('/resumes/:id/restore/:versionId', restoreVersion);
router.get('/resumes', getAllResumes);
router.get('/resumes/:id', getResumeById);
router.put('/resumes/:id', updateResume);
router.delete('/resumes/:id', deleteResume);
router.get('/resumes/:id/download', downloadResume);
router.post('/resumes/:id/score', scoreContentOnly);
router.get('/resumes/:id/inline-suggestions', getInlineSuggestions);
router.post('/resumes/improve-text', improveSelectedText);
router.post('/resumes/generate-regional', generateRegionalCV);
router.post('/resumes/:id/draft-email', draftEmailAndCV as any);
router.post('/resumes/:id/send-email', sendEmailWithCV as any);

// ─── EXTENSION & JOB DESCRIPTIONS ───────────────────────────────────────
router.post('/job-descriptions', saveJobDescription as any);
router.post('/job-descriptions/analyze-html', analyzeJobHtml as any);
router.get('/job-descriptions', getJobDescriptions as any);
router.get('/job-descriptions/:id', getJobDescription as any);
router.delete('/job-descriptions/:id', deleteJobDescription as any);


// ─── RESUME VERSION MANAGER & COVER LETTERS ──────────────────────────────
router.get('/resumes/:id/versions', getResumeVersions as any);
router.post('/resumes/:id/versions', createResumeVersion as any);
router.get('/resumes/versions/:versionId', getResumeVersionById as any);
router.delete('/resumes/versions/:versionId', deleteResumeVersion as any);
router.post('/resumes/versions/:versionId/duplicate', duplicateResumeVersion as any);
router.post('/resumes/versions/:versionId/cover-letter', generateCoverLetterForVersion as any);
router.put('/resumes/versions/:versionId/cover-letter', updateCoverLetter as any);

// ─── KANBAN BOARD APPLICATIONS ──────────────────────────────────────────
router.get('/applications', getApplications);
router.post('/applications', createApplication);
router.put('/applications/:id', updateApplication);
router.delete('/applications/:id', deleteApplication);

// ─── TAILORED VERSION AI COMPANION HELPERS ───────────────────────────────
router.post('/resumes/versions/:versionId/inject-keywords', injectKeywordsForVersion);
router.get('/resumes/versions/:versionId/interview-questions', getMockInterviewQuestions);
router.post('/resumes/versions/interview-feedback', evaluateInterviewAnswerForVersion);
router.post('/resumes/versions/:versionId/outreach', generateOutreachMessageForVersion);
router.get('/resumes/versions/:versionId/salary-insights', getSalaryInsightsForVersion);

router.post('/notification/token', saveNotificationToken);

export default router;