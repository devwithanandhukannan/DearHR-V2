import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Ensure the encryption key is exactly 32 bytes for AES-256-CBC
const ENCRYPTION_KEY = (process.env.SMTP_ENCRYPTION_KEY || 'd3aRhR_seCrEt_eNcRyPtIoN_kEy_32b').slice(0, 32).padEnd(32, '0');
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
  try {
    const textParts = text.split(':');
    const ivHex = textParts.shift();
    if (!ivHex) throw new Error('Invalid IV');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('SMTP Decryption error:', error);
    throw new Error('Failed to decrypt SMTP credentials.');
  }
};

interface SendEmailOptions {
  host: string;
  port: number;
  user: string;
  pass: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    content: Buffer;
  }[];
}

export const sendSmtpEmail = async (options: SendEmailOptions) => {
  const transporter = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.port === 465,
    auth: {
      user: options.user,
      pass: options.pass,
    },
  });

  return transporter.sendMail({
    from: `"DearHR User" <${options.user}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
};
