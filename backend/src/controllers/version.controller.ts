import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';
import { generateCoverLetter as aiGenerateCoverLetter, analyzeJobHtmlWithAI } from '../services/groq.service.ts';

const getProfileId = async (userId: string) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
};


export const saveJobDescription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, error: 'Profile not found' });

    const { title, company, descriptionText } = req.body;
    if (!descriptionText) {
      return res.status(400).json({ success: false, error: 'Job description text is required' });
    }

    const jd = await prisma.jobDescription.create({
      data: {
        jobSeekerId: profileId,
        title: (title as string) || 'Untitled Role',
        company: (company as string) || 'Unknown Company',
        descriptionText: descriptionText as string,
      }
    });

    return res.status(201).json({ success: true, data: jd });
  } catch (err: any) {
    console.error('saveJobDescription error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const getJobDescription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, error: 'Profile not found' });

    const id = req.params.id as string;
    const jd = await prisma.jobDescription.findFirst({
      where: { id, jobSeekerId: profileId }
    });

    if (!jd) {
      return res.status(404).json({ success: false, error: 'Job description not found' });
    }

    return res.status(200).json({ success: true, data: jd });
  } catch (err: any) {
    console.error('getJobDescription error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const getJobDescriptions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, error: 'Profile not found' });

    const jds = await prisma.jobDescription.findMany({
      where: { jobSeekerId: profileId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: jds });
  } catch (err: any) {
    console.error('getJobDescriptions error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const deleteJobDescription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, error: 'Profile not found' });

    const id = req.params.id as string;
    
    const jd = await prisma.jobDescription.findFirst({
      where: { id, jobSeekerId: profileId }
    });

    if (!jd) {
      return res.status(404).json({ success: false, error: 'Job description not found' });
    }

    await prisma.jobDescription.delete({
      where: { id }
    });

    return res.status(200).json({ success: true, message: 'Job description deleted successfully.' });
  } catch (err: any) {
    console.error('deleteJobDescription error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const getResumeVersions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const resumeId = req.params.id as string;

    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId },
      include: { coverLetter: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: versions });
  } catch (err: any) {
    console.error('getResumeVersions error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const getResumeVersionById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const versionId = req.params.versionId as string;

    const version = await prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: { coverLetter: true, resume: true, application: true }
    });

    if (!version) return res.status(404).json({ success: false, error: 'Resume version not found' });

    return res.status(200).json({ success: true, data: version });
  } catch (err: any) {
    console.error('getResumeVersionById error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const createResumeVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const resumeId = req.params.id as string;
    const { jobTitle, company, atsScore, content } = req.body;

    const version = await prisma.resumeVersion.create({
      data: {
        resumeId,
        jobTitle: (jobTitle as string) || 'Tailored Role',
        company: (company as string) || 'Target Company',
        atsScore: atsScore ? parseInt(atsScore as string, 10) : null,
        content: content || {},
      }
    });

    return res.status(201).json({ success: true, data: version });
  } catch (err: any) {
    console.error('createResumeVersion error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const deleteResumeVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const versionId = req.params.versionId as string;

    await prisma.resumeVersion.delete({
      where: { id: versionId }
    });

    return res.status(200).json({ success: true, message: 'Version deleted successfully' });
  } catch (err: any) {
    console.error('deleteResumeVersion error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const duplicateResumeVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const versionId = req.params.versionId as string;

    const original = await prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: { coverLetter: true }
    }) as any;

    if (!original) return res.status(404).json({ success: false, error: 'Version not found' });

    const copy = await prisma.resumeVersion.create({
      data: {
        resumeId: original.resumeId,
        jobTitle: `${original.jobTitle} (Copy)`,
        company: original.company,
        atsScore: original.atsScore,
        content: original.content || {},
        coverLetter: original.coverLetter ? {
          create: {
            subject: original.coverLetter.subject,
            body: original.coverLetter.body
          }
        } : undefined
      }
    });

    return res.status(201).json({ success: true, data: copy });
  } catch (err: any) {
    console.error('duplicateResumeVersion error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const generateCoverLetterForVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const versionId = req.params.versionId as string;
    const { jobDescription, tone } = req.body;

    const version = await prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: { resume: true }
    }) as any;

    if (!version) return res.status(404).json({ success: false, error: 'Resume version not found' });

    const content = (version.content as any) || (version.resume?.content as any) || {};
    const resumeText = content.htmlContent || JSON.stringify(content);

    const generated = await aiGenerateCoverLetter(
      resumeText,
      (jobDescription as string) || '',
      (tone as 'formal' | 'concise') || 'formal',
      version.company || undefined,
      version.jobTitle || undefined
    );

    const coverLetter = await prisma.coverLetter.upsert({
      where: { resumeVersionId: versionId },
      create: {
        resumeVersionId: versionId,
        subject: generated.subject || 'Cover Letter',
        body: generated.body || '',
      },
      update: {
        subject: generated.subject || 'Cover Letter',
        body: generated.body || '',
      }
    });

    return res.status(200).json({ success: true, data: coverLetter });
  } catch (err: any) {
    console.error('generateCoverLetterForVersion error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const updateCoverLetter = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const versionId = req.params.versionId as string;
    const { subject, body } = req.body;

    const coverLetter = await prisma.coverLetter.upsert({
      where: { resumeVersionId: versionId },
      create: {
        resumeVersionId: versionId,
        subject: (subject as string) || 'Cover Letter',
        body: (body as string) || '',
      },
      update: {
        subject: (subject as string) || undefined,
        body: (body as string) || '',
      }
    });

    return res.status(200).json({ success: true, data: coverLetter });
  } catch (err: any) {
    console.error('updateCoverLetter error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

export const analyzeJobHtml = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { html, url, domain } = req.body;
    if (!html) {
      return res.status(400).json({ success: false, error: 'Page HTML content is required' });
    }

    let primaryResumeText = '';
    if (userId) {
      const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
      if (profile) {
        const resume = await prisma.resume.findFirst({
          where: { jobSeekerId: profile.id, isPrimary: true }
        }) || await prisma.resume.findFirst({
          where: { jobSeekerId: profile.id },
          orderBy: { updatedAt: 'desc' }
        });
        if (resume?.content) {
          const c: any = resume.content;
          primaryResumeText = c.htmlContent || c.summary || JSON.stringify(c);
        }
      }
    }

    const researchData = await analyzeJobHtmlWithAI(
      html as string,
      (url as string) || '',
      (domain as string) || '',
      primaryResumeText
    );
    return res.status(200).json({ success: true, data: researchData });
  } catch (err: any) {
    console.error('analyzeJobHtml controller error:', err);
    return res.status(500).json({ success: false, error: err.message || 'AI webpage analysis failed' });
  }
};


