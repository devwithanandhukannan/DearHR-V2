import nodemailer from 'nodemailer';

// Setup connection configurations utilizing environment parameters
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'workbridge.anandhu@gmail.com',
    pass: process.env.SMTP_PASS || 'hackerpass', // This should be a 16-character App Password if using 2FA
  },
});

interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Shared wrapper layout to fire SMTP transactional emails safely
 */
export const sendEmail = async ({ to, subject, html, attachments }: SendEmailOptions): Promise<void> => {
  const fromEmail = process.env.EMAIL_FROM || 'workbridge.anandhu@gmail.com';

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"WorkBridge Support" <${fromEmail}>`,
    to,
    subject,
    html,
  };

  // Attach files if provided (for offer letters, invoices, etc.)
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Operational SMTP email successfully dispatched to: ${to}`);
  } catch (error) {
    console.error(`❌ Critical error dispatching SMTP email to ${to}:`, error);
    throw new Error('SMTP transactional delivery channel crashed.');
  }
};

/**
 * Legacy wrapper for backwards compatibility
 */
export const sendMail = sendEmail;

/**
 * Explicit helper to format and dispatch the unique registration/verification token link
 */
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  // Update this domain link with your actual Frontend client endpoint structure
  const clientAppUrl = process.env.COMPANY_URL || 'http://localhost:3001';
  const completeVerificationUrl = `${clientAppUrl}/verify-email?token=${token}`;

  const htmlTemplate = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-md;">
      <h2 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Verify your WorkBridge Workspace</h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">
        Thank you for choosing WorkBridge. Please confirm your corporate email address to unlock your recruiter management control panel.
      </p>
      <div style="margin: 32px 0;">
        <a href="${completeVerificationUrl}" 
           style="background-color: #000000; color: #ffffff; padding: 12px 24px; font-weight: 500; text-decoration: none; border-radius: 8px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        This activation connection token will expire automatically in 24 hours. If you did not initiate this workspace configuration, please ignore this communication.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">
        Secure link raw context fallback: <br/>
        <a href="${completeVerificationUrl}" style="color: #2563eb;">${completeVerificationUrl}</a>
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Action Required: Activate Your Corporate Workspace Profile',
    html: htmlTemplate,
  });
};

export const sendTeamInviteEmail = async (
  email: string, 
  inviteLink: string, 
  role: string, 
  companyName: string
): Promise<void> => {
  const roleLabels: Record<string, string> = {
    hr_manager: 'HR Hiring Manager',
    interviewer: 'Technical Evaluator / Interviewer',
    viewer: 'Pipeline Reviewer (Viewer Profile)'
  };

  const assignedRoleLabel = roleLabels[role] || role;

  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #1c1c1e; background-color: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <div style="margin-bottom: 24px;">
        <span style="font-weight: 700; font-size: 16px; tracking-content: -0.05em; color: #ffffff; font-family: monospace;">WORK//BRIDGE</span>
      </div>
      
      <h2 style="color: #ffffff; font-size: 20px; font-weight: 600; tracking-content: -0.02em; margin-top: 0; margin-bottom: 12px;">
        Join ${companyName} on WorkBridge
      </h2>
      
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        You have been formally invited to join the corporate workspace for <strong style="color: #ffffff;">${companyName}</strong> as a designated <strong style="color: #ffffff;">${assignedRoleLabel}</strong>. This gives you secure access to manage the live candidate evaluation pipeline, sandboxes, and structural interview blocks.
      </p>
      
      <div style="margin: 28px 0;">
        <a href="${inviteLink}" 
           style="background-color: #ffffff; color: #000000; padding: 11px 20px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; transition: all 0.15s ease;">
          Accept Workspace Invitation
        </a>
      </div>
      
      <p style="color: #71717a; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
        This secure activation parameter will expire automatically in 7 days. If you were not expecting this corporate affiliation request, you can safely dismiss this message.
      </p>
      
      <hr style="border: 0; border-top: 1px solid #1c1c1e; margin: 24px 0;" />
      
      <p style="color: #52525b; font-size: 11px; font-family: monospace; word-break: break-all; margin: 0;">
        Fallback Raw Token Link:<br/>
        <a href="${inviteLink}" style="color: #a1a1aa; text-decoration: underline;">${inviteLink}</a>
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Invitation to join ${companyName} on WorkBridge`,
    html: htmlTemplate
  });
};

/**
 * 🎯 NEW: Send offer letter email with PDF attachment and tracking pixel
 */
export const sendOfferLetterEmail = async (
  candidateEmail: string,
  candidateName: string,
  position: string,
  companyName: string,
  companyLogoUrl: string | null,
  offerId: string,
  pdfPath: string
): Promise<void> => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  
  const viewOfferLink = `${frontendUrl}/offers/${offerId}`;
  const trackingPixel = `<img src="${backendUrl}/api/offers/${offerId}/track" width="1" height="1" style="display:block;" />`;

  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #0a0a0a;">
      
      <!-- Header Section -->
      <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid #27272a;">
        ${companyLogoUrl 
          ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-width: 120px; height: auto; margin-bottom: 20px;" />`
          : `<div style="font-weight: 700; font-size: 20px; color: #ffffff; font-family: monospace; margin-bottom: 20px;">${companyName}</div>`
        }
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; tracking-content: -0.02em;">
          Congratulations! 🎉
        </h1>
      </div>

      <!-- Content Section -->
      <div style="padding: 40px 32px; background-color: #0a0a0a; color: #ffffff;">
        <p style="color: #e4e4e7; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Dear <strong style="color: #ffffff;">${candidateName}</strong>,
        </p>

        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          We are delighted to extend an official offer of employment for the position of 
          <strong style="color: #ffffff;">${position}</strong> at <strong style="color: #ffffff;">${companyName}</strong>.
        </p>

        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          Your skills, experience, and interview performance have impressed our team, and we believe you'll be an excellent addition to our organization.
        </p>

        <!-- Call to Action -->
        <div style="margin: 36px 0; text-align: center;">
          <a href="${viewOfferLink}" 
             style="background-color: #ffffff; color: #000000; padding: 14px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block; transition: all 0.2s ease;">
            📄 View & Respond to Offer Letter
          </a>
        </div>

        <!-- Instructions -->
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="color: #fbbf24; font-size: 13px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; tracking-content: 0.05em;">
            📌 Next Steps
          </p>
          <ul style="color: #a1a1aa; font-size: 14px; line-height: 1.7; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Review the attached offer letter PDF carefully</li>
            <li style="margin-bottom: 8px;">Click the button above to access your digital dashboard</li>
            <li style="margin-bottom: 8px;">You can <strong style="color: #ffffff;">Accept</strong>, <strong style="color: #ffffff;">Decline</strong>, or <strong style="color: #ffffff;">Request Negotiation</strong></li>
            <li style="margin-bottom: 0;">Sign digitally to finalize your acceptance</li>
          </ul>
        </div>

        <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
          We're excited about the possibility of you joining our team. If you have any questions, please don't hesitate to reach out.
        </p>

        <p style="color: #a1a1aa; font-size: 14px; margin: 28px 0 0 0;">
          Best regards,<br/>
          <strong style="color: #ffffff;">The ${companyName} Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #18181b; border-top: 1px solid #27272a; padding: 24px 32px; text-align: center;">
        <p style="color: #52525b; font-size: 11px; margin: 0 0 8px 0; font-family: monospace;">
          This offer is confidential and intended solely for ${candidateName}
        </p>
        <p style="color: #3f3f46; font-size: 11px; margin: 0;">
          Secure Link: <a href="${viewOfferLink}" style="color: #71717a; text-decoration: underline;">${viewOfferLink}</a>
        </p>
        <p style="color: #27272a; font-size: 10px; margin: 12px 0 0 0; font-family: monospace;">
          WORK//BRIDGE © ${new Date().getFullYear()} • Automated Hiring Infrastructure
        </p>
      </div>

      <!-- Tracking Pixel -->
      ${trackingPixel}
    </div>
  `;

  await sendEmail({
    to: candidateEmail,
    subject: `🎉 Offer Letter: ${position} at ${companyName}`,
    html: htmlTemplate,
    attachments: [
      {
        filename: `${companyName}-Offer-Letter-${position.replace(/\s+/g, '-')}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf'
      }
    ]
  });
};

/**
 * 🎯 NEW: Notify company when candidate responds to offer
 */
export const sendOfferResponseNotification = async (
  companyEmail: string,
  candidateName: string,
  position: string,
  response: 'accept' | 'decline' | 'negotiate',
  negotiationNote?: string
): Promise<void> => {
  const responseMessages = {
    accept: {
      emoji: '✅',
      title: 'Offer Accepted',
      message: `Great news! ${candidateName} has accepted the offer for ${position}.`,
      color: '#10b981'
    },
    decline: {
      emoji: '❌',
      title: 'Offer Declined',
      message: `${candidateName} has declined the offer for ${position}.`,
      color: '#ef4444'
    },
    negotiate: {
      emoji: '💬',
      title: 'Negotiation Requested',
      message: `${candidateName} has requested to negotiate the offer for ${position}.`,
      color: '#f59e0b'
    }
  };

  const config = responseMessages[response];

  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #27272a; background-color: #0a0a0a; color: #ffffff; border-radius: 16px;">
      
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 12px;">${config.emoji}</div>
        <h2 style="color: ${config.color}; font-size: 22px; font-weight: 700; margin: 0;">
          ${config.title}
        </h2>
      </div>

      <p style="color: #e4e4e7; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        ${config.message}
      </p>

      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px 0;"><strong style="color: #ffffff;">Candidate:</strong> ${candidateName}</p>
        <p style="color: #a1a1aa; font-size: 13px; margin: 0;"><strong style="color: #ffffff;">Position:</strong> ${position}</p>
      </div>

      ${negotiationNote ? `
        <div style="background-color: #18181b; border-left: 3px solid ${config.color}; padding: 16px; margin: 20px 0;">
          <p style="color: #fbbf24; font-size: 12px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase;">Negotiation Message:</p>
          <p style="color: #d4d4d8; font-size: 14px; margin: 0; font-style: italic;">"${negotiationNote}"</p>
        </div>
      ` : ''}

      <p style="color: #71717a; font-size: 13px; margin: 24px 0 0 0;">
        Log in to your WorkBridge dashboard to view full details and take next steps.
      </p>

    </div>
  `;

  await sendEmail({
    to: companyEmail,
    subject: `${config.emoji} Offer Response: ${candidateName} - ${position}`,
    html: htmlTemplate
  });
};