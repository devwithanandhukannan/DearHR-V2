import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.ts';

const getProfileId = async (userId: string) => {
  const profile = await prisma.jobSeekerProfile.findFirst({ where: { userId } });
  return profile?.id;
};

export const getApplications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const apps = await prisma.jobApplication.findMany({
      where: { jobSeekerProfileId: profileId },
      include: {
        resumeVersion: {
          select: {
            id: true,
            jobTitle: true,
            company: true,
            atsScore: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error('getApplications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

export const createApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { title, company, descriptionText, status, notes, resumeVersionId } = req.body;
    if (!title || !company) {
      return res.status(400).json({ success: false, message: 'Title and Company are required' });
    }

    const app = await prisma.jobApplication.create({
      data: {
        jobSeekerProfileId: profileId,
        title,
        company,
        descriptionText: descriptionText || null,
        status: status || 'wishlist',
        notes: notes || null,
        resumeVersionId: resumeVersionId || null,
        appliedAt: (status === 'applied' || status === 'interviewing') ? new Date() : null,
      },
      include: {
        resumeVersion: {
          select: {
            id: true,
            jobTitle: true,
            company: true,
            atsScore: true,
          }
        }
      }
    });

    return res.status(201).json({ success: true, data: app });
  } catch (err) {
    console.error('createApplication error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create application' });
  }
};

export const updateApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const id = req.params.id as string;
    const { status, notes, appliedAt, resumeVersionId, title, company } = req.body;

    const existing = await prisma.jobApplication.findFirst({
      where: { id, jobSeekerProfileId: profileId }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Application not found' });

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? notes : existing.notes,
        appliedAt: appliedAt !== undefined ? (appliedAt ? new Date(appliedAt) : null) : existing.appliedAt,
        resumeVersionId: resumeVersionId !== undefined ? resumeVersionId : existing.resumeVersionId,
        title: title !== undefined ? title : existing.title,
        company: company !== undefined ? company : existing.company,
      },
      include: {
        resumeVersion: {
          select: {
            id: true,
            jobTitle: true,
            company: true,
            atsScore: true,
          }
        }
      }
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateApplication error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update application' });
  }
};

export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const id = req.params.id as string;
    const existing = await prisma.jobApplication.findFirst({
      where: { id, jobSeekerProfileId: profileId }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Application not found' });

    await prisma.jobApplication.delete({
      where: { id }
    });

    return res.json({ success: true, message: 'Application deleted successfully' });
  } catch (err) {
    console.error('deleteApplication error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete application' });
  }
};
