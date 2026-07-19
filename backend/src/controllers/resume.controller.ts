import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
// @ts-ignore
import htmlPdf from 'html-pdf-node';
import { prisma } from '../utils/prisma.ts';
import { extractText } from '../utils/textExtractor.ts';
import { 
  analyzeResume, 
  generateFreshCV, 
  convertToHTML, 
  optimizeForJD, 
  suggestKeywords,
  contextualInjectKeywords,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateColdOutreach,
  generateSalaryNegotiation
} from '../services/groq.service.ts';
import { scoreResumeContent, generateInlineSuggestions, processTextSelection, generateRegionalResumeTemplate } from '../services/groq.service.ts';

const getProfileId = async (userId: string) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
};

const readContent = (resume: any) => (resume.content as any) ?? {};
const readAI = (resume: any) => (resume.aiSuggestions as any) ?? {};

const pushVersion = (contentData: any, label?: string) => {
  const versions: any[] = contentData.versions ?? [];
  if (contentData.htmlContent) {
    versions.push({
      id: Date.now().toString(),
      label: label ?? `Version ${versions.length + 1}`,
      htmlContent: contentData.htmlContent,
      savedAt: new Date().toISOString(),
    });
    if (versions.length > 20) versions.shift();
  }
  contentData.versions = versions;
};

export const uploadAndAnalyze = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Job seeker profile not found' });
    }

    const { name, jobDescription } = req.body;
    const rawText = await extractText(req.file.path, req.file.mimetype);

    if (!rawText || rawText.length < 50) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(422).json({ success: false, message: 'Could not extract text — is it a scanned PDF?' });
    }

    const analysis = await analyzeResume(rawText, jobDescription);

    const contentData = {
      rawText,
      parsedData: analysis.parsedData ?? {},
      atsBreakdown: analysis.atsBreakdown ?? {},
      autoCorrectedText: analysis.autoCorrectedText ?? null,
      htmlContent: null, 
      margins: { top: 60, right: 72, bottom: 60, left: 72 },
      template: 'default',
      versions: [],
    };

    const aiData = {
      scores: analysis.scores ?? {},
      strengths: analysis.strengths ?? [],
      improvements: analysis.improvements ?? {},
      missingSections: analysis.missingSections ?? [],
      keywordGaps: analysis.keywordGaps ?? [],
      jdOptimizationNotes: analysis.jdOptimizationNotes ?? '',
    };

    const atsScore = analysis.scores?.ats ?? null;

    const resume = await prisma.resume.create({
      data: {
        jobSeekerProfileId: profileId,
        name: name?.trim() || req.file.originalname.replace(/\.[^.]+$/, ''),
        source: 'uploaded',
        filePath: req.file.path,
        atsScore,
        content: contentData,
        aiSuggestions: aiData,
        isPrimary: false,
      },
    });

    return res.status(201).json({ success: true, data: resume });
  } catch (err) {
    console.error('uploadAndAnalyze error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to process resume' });
  }
};

export const compileResumeHtml = (data: any): string => {
  const containerStyle = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; line-height: 1.5; font-size: 13px; padding: 36px 40px; background: #ffffff; margin: 0 auto; box-sizing: border-box; max-width: 800px;";
  const nameStyle = "font-size: 22px; font-weight: 800; text-align: center; color: #111827; letter-spacing: -0.02em; margin: 0 0 6px 0; text-transform: uppercase;";
  const contactStyle = "display: flex; justify-content: center; flex-wrap: wrap; gap: 4px 10px; font-size: 11.5px; color: #4b5563; font-weight: 500; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;";
  const sectionTitleStyle = "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #111827; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px;";
  const bodyStyle = "color: #374151; margin-bottom: 10px; font-size: 13px; text-align: justify;";
  const linkStyle = "color: #2563eb; text-decoration: none; border-bottom: 1px dashed rgba(37,99,235,0.4);";
  const itemHeaderStyle = "display: flex; justify-content: space-between; align-items: baseline; font-weight: 600; color: #111827; margin-bottom: 2px; font-size: 13px;";
  const itemSubheaderStyle = "display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; color: #4b5563; font-style: italic; margin-bottom: 6px;";
  const listStyle = "margin: 4px 0 10px 0; padding-left: 18px; list-style-type: disc; color: #4b5563; font-size: 12.5px;";
  const listItemStyle = "margin-bottom: 3px; line-height: 1.45;";

  let contactHtml = `<div style="${contactStyle}">`;
  const contactParts = [];
  if (data.contact?.location) contactParts.push(`<span>${data.contact.location}</span>`);
  if (data.contact?.phone) contactParts.push(`<span>${data.contact.phone}</span>`);
  if (data.contact?.email) contactParts.push(`<span><a href="mailto:${data.contact.email}" style="${linkStyle}">${data.contact.email}</a></span>`);
  
  if (data.contact?.links) {
    data.contact.links.forEach((link: string) => {
      let displayLink = link.replace(/https?:\/\/(www\.)?/, '');
      if (displayLink.length > 25) displayLink = displayLink.substring(0, 25) + '...';
      contactParts.push(`<span><a style="${linkStyle}" href="${link}" target="_blank" rel="noopener noreferrer">${displayLink}</a></span>`);
    });
  }
  contactHtml += contactParts.join(' <span style="color: #e5e7eb; font-weight: 300;">|</span> ');
  contactHtml += `</div>`;

  let html = `<div style="${containerStyle}">`;
  html += `<div style="${nameStyle}">${data.fullName || ''}</div>`;
  html += contactHtml;

  // Summary Section
  if (data.summary) {
    html += `<div style="${sectionTitleStyle}">Professional Summary</div>`;
    html += `<p style="${bodyStyle}">${data.summary}</p>`;
  }

  // Skills Section
  if (data.skills?.length) {
    html += `<div style="${sectionTitleStyle}">Skills & Expertise</div>`;
    html += `<div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;">`;
    data.skills.forEach((skill: string) => {
      html += `<span style="background-color: #f9fafb; color: #374151; font-size: 11.5px; font-weight: 500; padding: 3px 8px; border-radius: 4px; border: 1px solid #e5e7eb; display: inline-block;">${skill}</span>`;
    });
    html += `</div>`;
  }

  // Experience Section
  if (data.experience?.length) {
    html += `<div style="${sectionTitleStyle}">Professional Experience</div>`;
    data.experience.forEach((exp: any) => {
      html += `<div style="margin-bottom: 14px;">`;
      html += `<div style="${itemHeaderStyle}"><span>${exp.role}</span><span style="font-size: 11.5px; font-weight: 500; color: #6b7280;">${exp.duration || ''}</span></div>`;
      html += `<div style="${itemSubheaderStyle}"><span>${exp.company}</span><span>${exp.location || ''}</span></div>`;
      if (exp.bullets?.length) {
        html += `<ul style="${listStyle}">`;
        exp.bullets.forEach((b: string) => html += `<li style="${listItemStyle}">${b}</li>`);
        html += `</ul>`;
      }
      html += `</div>`;
    });
  }

  // Projects Section
  if (data.projects?.length) {
    html += `<div style="${sectionTitleStyle}">Projects</div>`;
    data.projects.forEach((proj: any) => {
      html += `<div style="margin-bottom: 14px;">`;
      html += `<div style="${itemHeaderStyle}"><span>${proj.name}</span>`;
      if (proj.link) {
        let displayLink = proj.link.replace(/https?:\/\/(www\.)?/, '');
        if (displayLink.length > 20) displayLink = displayLink.substring(0, 20) + '...';
        html += `<span style="font-size: 11.5px; font-weight: 500;"><a href="${proj.link}" style="${linkStyle}" target="_blank" rel="noopener noreferrer">${displayLink}</a></span>`;
      } else {
        html += `<span style="font-size: 11.5px; font-weight: 500; color: #6b7280;">Project</span>`;
      }
      html += `</div>`;
      if (proj.technologies?.length) {
        html += `<div style="font-size: 11px; color: #4b5563; font-style: italic; margin-bottom: 5px;">Technologies: ${proj.technologies.join(', ')}</div>`;
      }
      if (proj.description) {
        html += `<p style="${bodyStyle}">${proj.description}</p>`;
      }
      html += `</div>`;
    });
  }

  // Education Section
  if (data.education?.length) {
    html += `<div style="${sectionTitleStyle}">Education</div>`;
    data.education.forEach((edu: any) => {
      html += `<div style="margin-bottom: 10px;">`;
      html += `<div style="${itemHeaderStyle}"><span>${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</span><span style="font-size: 11.5px; font-weight: 500; color: #6b7280;">${edu.duration || ''}</span></div>`;
      html += `<div style="${itemSubheaderStyle}"><span>${edu.institution}</span><span></span></div>`;
      if (edu.details) {
        html += `<p style="${bodyStyle}; font-size: 12px; margin-top: -3px;">${edu.details}</p>`;
      }
      html += `</div>`;
    });
  }

  // Certifications Section
  if (data.certifications?.length) {
    html += `<div style="${sectionTitleStyle}">Certifications</div>`;
    html += `<ul style="${listStyle}">`;
    data.certifications.forEach((c: string) => {
      html += `<li style="${listItemStyle}">${c}</li>`;
    });
    html += `</ul>`;
  }

  // Languages Section
  if (data.languages?.length) {
    html += `<div style="${sectionTitleStyle}">Languages</div>`;
    html += `<p style="${bodyStyle}">${data.languages.join(', ')}</p>`;
  }

  // Achievements Section
  if (data.achievements?.length) {
    html += `<div style="${sectionTitleStyle}">Key Achievements</div>`;
    html += `<ul style="${listStyle}">`;
    data.achievements.forEach((a: string) => {
      html += `<li style="${listItemStyle}">${a}</li>`;
    });
    html += `</ul>`;
  }

  html += `</div>`;
  return html;
};

const compileResumeText = (data: any): string => {
  let text = '';
  if (data.fullName) text += `${data.fullName}\n`;
  if (data.contact) {
    const parts = [];
    if (data.contact.location) parts.push(data.contact.location);
    if (data.contact.phone) parts.push(data.contact.phone);
    if (data.contact.email) parts.push(data.contact.email);
    if (data.contact.links) parts.push(...data.contact.links);
    text += parts.join(' | ') + '\n';
  }
  if (data.summary) {
    text += `\nProfessional Summary\n${data.summary}\n`;
  }
  if (data.skills && data.skills.length) {
    text += `\nSkills\n${data.skills.join(', ')}\n`;
  }
  if (data.experience && data.experience.length) {
    text += `\nExperience\n`;
    data.experience.forEach((exp: any) => {
      text += `${exp.role} at ${exp.company} (${exp.duration || ''})\n`;
      if (exp.location) text += `${exp.location}\n`;
      if (exp.bullets && exp.bullets.length) {
        exp.bullets.forEach((b: string) => {
          text += `- ${b}\n`;
        });
      }
    });
  }
  if (data.projects && data.projects.length) {
    text += `\nProjects\n`;
    data.projects.forEach((proj: any) => {
      text += `${proj.name} (${proj.technologies ? proj.technologies.join(', ') : ''})\n`;
      if (proj.description) text += `${proj.description}\n`;
    });
  }
  if (data.education && data.education.length) {
    text += `\nEducation\n`;
    data.education.forEach((edu: any) => {
      text += `${edu.degree} in ${edu.field || ''} - ${edu.institution} (${edu.duration || ''})\n`;
      if (edu.details) text += `${edu.details}\n`;
    });
  }
  if (data.certifications && data.certifications.length) {
    text += `\nCertifications\n${data.certifications.join('\n')}\n`;
  }
  if (data.languages && data.languages.length) {
    text += `\nLanguages\n${data.languages.join(', ')}\n`;
  }
  if (data.achievements && data.achievements.length) {
    text += `\nKey Achievements\n${data.achievements.join('\n')}\n`;
  }
  return text;
};

export const generateCV = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { customPrompt, jobDescription } = req.body;

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: { skills: true, education: true, experience: true, projects: true, certifications: true, languages: true, achievements: true },
    });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const generated = await generateFreshCV(profile, customPrompt, jobDescription);
    const finalHtmlContent = generated.resumeData ? compileResumeHtml(generated.resumeData) : '';
    const rawText = generated.resumeData ? compileResumeText(generated.resumeData) : '';

    const contentData = {
      htmlContent: finalHtmlContent,
      rawText,
      parsedData: generated.resumeData ?? {},
      atsBreakdown: generated.atsBreakdown ?? {},
      margins: { top: 60, right: 72, bottom: 60, left: 72 },
      template: 'default',
      versions: [],
      customPrompt: customPrompt ?? null,
    };

    const aiData = {
      scores: generated.scores ?? {},
      strengths: generated.strengths ?? [],
      improvements: generated.improvements ?? {},
      missingSections: generated.missingSections ?? [],
      keywordGaps: generated.keywordGaps ?? [],
    };

    const atsScore = generated.scores?.ats ?? null;

    const resume = await prisma.resume.create({
      data: {
        jobSeekerProfileId: profile.id,
        name: `${profile.fullName ?? 'My'} Resume`,
        source: 'built',
        atsScore,
        content: contentData,
        aiSuggestions: aiData,
        isPrimary: false,
      },
    });

    return res.status(201).json({ success: true, data: resume });
  } catch (err) {
    console.error('generateCV error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate CV' });
  }
};

export const downloadUploadedPDF = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const profileId = await getProfileId(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, message: 'Job seeker profile records mismatched.' });
    }

    const resume = await prisma.resume.findFirst({
      where: { id, jobSeekerProfileId: profileId },
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Document reference could not be found.' });
    }

    const safeDocumentName = resume.name.trim().replace(/[^a-zA-Z0-9-_ ]/g, '') || 'Resume';
    const clientSideFilename = `${safeDocumentName}.pdf`;

    // ─── CASE 1: PHYSICAL STORAGE ATTACHMENT (UPLOADED FILE) ───────────
    if (resume.filePath) {
      const absoluteDiskPath = path.resolve(resume.filePath);

      if (fs.existsSync(absoluteDiskPath)) {
        return res.download(absoluteDiskPath, clientSideFilename, (err) => {
          if (err && !res.headersSent) {
            return res.status(500).json({ success: false, message: 'File transfer pipe interrupted.' });
          }
        });
      }
      console.warn(`File expected on disk but missing at: ${absoluteDiskPath}. Falling back to dynamic HTML stream.`);
    }

    // ─── CASE 2: VIRTUAL MEMORY RENDERING (BUILT / AI OPTIMIZED RESUME) ───
    const contentData = readContent(resume);
    let htmlContent = contentData.htmlContent;

    if (!htmlContent && contentData.parsedData) {
      htmlContent = compileResumeHtml(contentData.parsedData);
    }

    if (!htmlContent) {
      return res.status(422).json({ 
        success: false, 
        message: 'This specific record does not contain renderable canvas content.' 
      });
    }

    const margins = contentData.margins ?? { top: 60, right: 72, bottom: 60, left: 72 };
    const pdfOptions = {
      format: 'A4',
      margin: {
        top: `${margins.top}px`,
        right: `${margins.right}px`,
        bottom: `${margins.bottom}px`,
        left: `${margins.left}px`,
      },
      printBackground: true,
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${clientSideFilename}"`);

    htmlPdf.generatePdf({ content: htmlContent }, pdfOptions)
      .then((pdfBuffer: Buffer) => {
        return res.status(200).send(pdfBuffer);
      })
      .catch((pdfErr: Error) => {
        console.error('PDF Engine generation pipeline exception:', pdfErr);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, message: 'PDF translation engine failed.' });
        }
      });

  } catch (err) {
    console.error('System Failure within downloadUploadedPDF route execution:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Internal Server Error handling document downstream extraction.' });
    }
  }
};

export const convertResumeToHTML = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const contentData = readContent(resume);
    if (contentData.htmlContent) return res.json({ success: true, data: resume });

    const htmlContent = await convertToHTML(contentData.parsedData ?? {});
    contentData.htmlContent = htmlContent;

    const updated = await prisma.resume.update({ where: { id }, data: { content: contentData } });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('convertResumeToHTML error:', err);
    return res.status(500).json({ success: false, message: 'Failed to convert' });
  }
};

export const optimizeResume = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const { jobDescription } = req.body;

    if (!jobDescription?.trim()) return res.status(400).json({ success: false, message: 'Job description required' });

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const contentData = readContent(resume);
    if (!contentData.htmlContent) {
      if (contentData.parsedData) {
        console.log('🔄 optimizeResume: htmlContent is empty. Generating HTML inline from parsedData...');
        contentData.htmlContent = await convertToHTML(contentData.parsedData);
      } else {
        return res.status(422).json({ success: false, message: 'Open resume in editor first to generate HTML' });
      }
    }

    const result = await optimizeForJD(contentData.htmlContent, jobDescription);

    pushVersion(contentData, 'Before JD optimization');
    contentData.htmlContent = result.htmlContent ?? contentData.htmlContent;

    const aiData = readAI(resume);
    aiData.scores = result.scores ?? aiData.scores;
    aiData.jdOptimizationNotes = result.notes ?? '';
    aiData.keywordsInserted = result.keywordsInserted ?? [];

    const atsScore = result.scores?.ats ?? resume.atsScore;

    await prisma.resume.update({
      where: { id },
      data: { content: contentData, aiSuggestions: aiData, atsScore },
    });

    return res.json({ success: true, data: { htmlContent: contentData.htmlContent, notes: result.notes, keywordsInserted: result.keywordsInserted } });
  } catch (err) {
    console.error('optimizeResume error:', err);
    return res.status(500).json({ success: false, message: 'Optimization failed' });
  }
};

export const getKeywordSuggestions = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });

    const contentData = readContent(resume);
    if (!contentData.htmlContent) return res.status(422).json({ success: false, message: 'Open in editor first' });

    const suggestions = await suggestKeywords(contentData.htmlContent);
    return res.json({ success: true, data: suggestions });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to suggest keywords' });
  }
};

export const getAllResumes = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resumes = await prisma.resume.findMany({
      where: { jobSeekerProfileId: profileId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        source: true,
        atsScore: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
        aiSuggestions: true,
      },
    });
    
    return res.json({ success: true, data: resumes });
  } catch (err) {
    console.error('getAllResumes error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch resume index metrics.' });
  }
};

export const getResumeById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: resume });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch' });
  }
};

export const updateResume = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    const { htmlContent, name, isPrimary, margins, template, versionLabel } = req.body;

    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const existing = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    const contentData = readContent(existing);

    if (versionLabel) pushVersion(contentData, versionLabel);
    if (htmlContent !== undefined) contentData.htmlContent = htmlContent;
    if (margins) contentData.margins = margins;
    if (template) contentData.template = template;

    await prisma.$transaction(async (tx) => {
      if (isPrimary === true) {
        await tx.resume.updateMany({ where: { jobSeekerProfileId: profileId }, data: { isPrimary: false } });
      }
      await tx.resume.update({
        where: { id },
        data: { content: contentData, ...(name && { name }), ...(isPrimary !== undefined && { isPrimary }) },
      });
    });

    return res.json({ success: true, message: 'Updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update' });
  }
};

export const restoreVersion = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const versionId = req.params.versionId as string;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });

    const contentData = readContent(resume);
    const version = (contentData.versions ?? []).find((v: any) => v.id === versionId);
    if (!version) return res.status(404).json({ success: false, message: 'Version not found' });

    pushVersion(contentData, 'Before restore');
    contentData.htmlContent = version.htmlContent;

    await prisma.resume.update({ where: { id }, data: { content: contentData } });
    return res.json({ success: true, data: { htmlContent: version.htmlContent } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to restore' });
  }
};

export const deleteResume = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });

    if (resume.filePath && fs.existsSync(resume.filePath)) fs.unlinkSync(resume.filePath);
    await prisma.resume.delete({ where: { id } });
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};

export const downloadResume = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Not found' });
    if (!resume.filePath || !fs.existsSync(resume.filePath)) return res.status(404).json({ success: false, message: 'File not found' });

    res.download(resume.filePath, resume.name + (resume.filePath.endsWith('.pdf') ? '.pdf' : '.docx'));
  } catch (err) {
    console.error('downloadResume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to download' });
  }
};

export const scoreContentOnly = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const contentData = readContent(resume);
    if (!contentData.htmlContent) return res.status(422).json({ success: false, message: 'No HTML content to score' });

    const result = await scoreResumeContent(contentData.htmlContent);
    
    const aiData = readAI(resume);
    aiData.scores = result.scores ?? aiData.scores;
    aiData.strengths = result.strengths ?? aiData.strengths;
    aiData.improvements = result.improvements ?? aiData.improvements;
    aiData.missingSections = result.missingSections ?? aiData.missingSections;
    aiData.keywordGaps = result.keywordGaps ?? aiData.keywordGaps;

    const atsScore = result.scores?.ats ?? resume.atsScore;
    contentData.atsBreakdown = result.atsBreakdown ?? contentData.atsBreakdown;

    await prisma.resume.update({
      where: { id },
      data: { content: contentData, aiSuggestions: aiData, atsScore },
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('scoreContentOnly error:', err);
    return res.status(500).json({ success: false, message: 'Scoring failed' });
  }
};

export const getInlineSuggestions = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const contentData = readContent(resume);
    if (!contentData.htmlContent) return res.status(422).json({ success: false, message: 'Open in editor first' });

    const result = await generateInlineSuggestions(contentData.htmlContent);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate suggestions' });
  }
};

export const improveSelectedText = async (req: Request, res: Response) => {
  try {
    // Check if the user object is properly mounted by your authentication middleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized profile request access' });
    }

    const { selectedText, action, customPrompt, context } = req.body;

    if (!selectedText?.trim()) {
      return res.status(400).json({ success: false, message: 'No text provided' });
    }
    if (!['grammar', 'rewrite', 'custom'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action parameter passed' });
    }
    if (action === 'custom' && !customPrompt?.trim()) {
      return res.status(400).json({ success: false, message: 'Custom prompt required' });
    }

    const result = await processTextSelection(selectedText, action, customPrompt, context);
    
    return res.json({ success: true, data: result });
  } catch (err: any) {
    // Explicitly trace the complete stack trace error output to your server terminal console
    console.error('Fatal internal failure inside improveSelectedText controller:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Text processing failed', 
      error: err?.message || 'Unknown processing error' 
    });
  }
};

export const generateRegionalCV = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { country, style, jobDescription } = req.body;

    if (!country) return res.status(400).json({ success: false, message: 'Country required' });

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: { skills: true, education: true, experience: true, projects: true, certifications: true, languages: true, achievements: true },
    });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const result = await generateRegionalResumeTemplate(profile, country, style || 'modern', jobDescription);
    
    const contentData = {
      htmlContent: result.htmlContent ?? '',
      atsBreakdown: {},
      margins: { top: 60, right: 72, bottom: 60, left: 72 },
      template: `${country}-${style || 'modern'}`,
      versions: [],
      country,
      style: style || 'modern',
      culturalNotes: result.culturalNotes,
    };

    const aiData = {
      scores: result.scores ?? {},
      strengths: [],
      improvements: {},
      missingSections: [],
      keywordGaps: [],
    };

    const resume = await prisma.resume.create({
      data: {
        jobSeekerProfileId: profile.id,
        name: `${profile.fullName ?? 'My'} Resume — ${country} ${style || 'Modern'}`,
        source: 'built',
        atsScore: result.scores?.ats ?? null,
        content: contentData,
        aiSuggestions: aiData,
        isPrimary: false,
      },
    });

    return res.status(201).json({ success: true, data: resume });
  } catch (err) {
    console.error('generateRegionalCV error:', err);
    return res.status(500).json({ success: false, message: 'Regional CV generation failed' });
  }
};

export const injectKeywordsForVersion = async (req: Request, res: Response) => {
  try {
    const versionId = req.params.versionId as string;
    const userId = req.user!.userId;
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ success: false, message: 'Keywords array required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const version = await prisma.resumeVersion.findFirst({
      where: { id: versionId, resume: { jobSeekerProfileId: profileId } }
    });
    if (!version) return res.status(404).json({ success: false, message: 'Resume version not found' });

    const contentData = (version.content as any) ?? {};
    if (!contentData.htmlContent) {
      return res.status(422).json({ success: false, message: 'No HTML content to inject keywords into' });
    }

    const result = await contextualInjectKeywords(contentData.htmlContent, keywords);

    contentData.htmlContent = result.htmlContent;
    contentData.notes = result.notes || contentData.notes;
    
    // Update matched and missing lists
    if (contentData.missingKeywords) {
      contentData.missingKeywords = contentData.missingKeywords.filter((k: string) => !keywords.includes(k));
    }
    if (contentData.matchedKeywords) {
      contentData.matchedKeywords = Array.from(new Set([...contentData.matchedKeywords, ...keywords]));
    }

    const updated = await prisma.resumeVersion.update({
      where: { id: versionId },
      data: {
        content: contentData,
        atsScore: result.scores?.ats ?? version.atsScore,
      }
    });

    return res.json({
      success: true,
      data: {
        htmlContent: result.htmlContent,
        atsScore: result.scores?.ats ?? version.atsScore,
        notes: result.notes,
        content: contentData
      }
    });
  } catch (err) {
    console.error('injectKeywordsForVersion error:', err);
    return res.status(500).json({ success: false, message: 'Failed to inject keywords' });
  }
};

export const getMockInterviewQuestions = async (req: Request, res: Response) => {
  try {
    const versionId = req.params.versionId as string;
    const userId = req.user!.userId;

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const version = await prisma.resumeVersion.findFirst({
      where: { id: versionId, resume: { jobSeekerProfileId: profileId } }
    });
    if (!version) return res.status(404).json({ success: false, message: 'Resume version not found' });

    const contentData = (version.content as any) ?? {};
    const htmlContent = contentData.htmlContent || '';
    const jobDescription = contentData.jobDescription || 'Technical Role';

    const result = await generateInterviewQuestions(htmlContent, jobDescription);
    return res.json({ success: true, data: result.questions });
  } catch (err) {
    console.error('getMockInterviewQuestions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate interview questions' });
  }
};

export const evaluateInterviewAnswerForVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and Answer are required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const result = await evaluateInterviewAnswer(question, answer);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('evaluateInterviewAnswerForVersion error:', err);
    return res.status(500).json({ success: false, message: 'Failed to evaluate mock answer' });
  }
};

export const generateOutreachMessageForVersion = async (req: Request, res: Response) => {
  try {
    const versionId = req.params.versionId as string;
    const userId = req.user!.userId;
    const { type, recipientTitle } = req.body;

    if (!type || !recipientTitle) {
      return res.status(400).json({ success: false, message: 'Type and Recipient Title are required' });
    }

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const version = await prisma.resumeVersion.findFirst({
      where: { id: versionId, resume: { jobSeekerProfileId: profileId } }
    });
    if (!version) return res.status(404).json({ success: false, message: 'Resume version not found' });

    const contentData = (version.content as any) ?? {};
    const htmlContent = contentData.htmlContent || '';
    const jobDescription = contentData.jobDescription || 'Job posting description details';

    const result = await generateColdOutreach(type, htmlContent, jobDescription, recipientTitle);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('generateOutreachMessageForVersion error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate outreach message' });
  }
};

export const getSalaryInsightsForVersion = async (req: Request, res: Response) => {
  try {
    const versionId = req.params.versionId as string;
    const userId = req.user!.userId;

    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: 'Profile not found' });

    const version = await prisma.resumeVersion.findFirst({
      where: { id: versionId, resume: { jobSeekerProfileId: profileId } }
    });
    if (!version) return res.status(404).json({ success: false, message: 'Resume version not found' });

    const contentData = (version.content as any) ?? {};
    const jobDescription = contentData.jobDescription || 'Technical Role';

    const result = await generateSalaryNegotiation(jobDescription);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('getSalaryInsightsForVersion error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch salary insights' });
  }
};