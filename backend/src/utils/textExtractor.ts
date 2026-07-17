// src/utils/textExtractor.ts
import fs from 'fs';
import mammoth from 'mammoth';
import { extractText as parsePdf } from 'unpdf';

export const extractText = async (filePath: string, mimeType: string): Promise<string> => {
  const buffer = fs.readFileSync(filePath);

  if (mimeType === 'application/pdf') {
    const uint8Array = new Uint8Array(buffer);
    const data = await parsePdf(uint8Array);
    
    // Fix: If it's an array of page strings, join them with spaces/newlines.
    // If it's already a string, it will safe-guard correctly.
    if (Array.isArray(data.text)) {
      return data.text.join('\n').trim();
    }
    
    return data.text ? String(data.text).trim() : '';
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
};