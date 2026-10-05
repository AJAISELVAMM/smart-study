import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import { config } from '../config.js';
import { HttpError } from '../utils.js';

export function cleanText(input) {
  return String(input || '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/(?<=[A-Za-z])-\n\s*(?=[a-z])/g, '')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n')
    .trim();
}

export function validatePdfFile(file) {
  if (!file?.buffer?.length) {
    throw new HttpError(400, 'Choose a PDF file before continuing.', 'EMPTY_UPLOAD');
  }
  const extension = path.extname(file.originalname || '').toLowerCase();
  if (extension !== '.pdf') {
    throw new HttpError(415, 'Only PDF files are supported.', 'UNSUPPORTED_FILE_TYPE');
  }
  if (file.size > config.maxUploadBytes) {
    const limitMb = Math.ceil(config.maxUploadBytes / (1024 * 1024));
    throw new HttpError(413, `This PDF exceeds the ${limitMb} MB upload limit.`, 'FILE_TOO_LARGE');
  }
  if (!file.buffer.subarray(0, 1024).includes(Buffer.from('%PDF'))) {
    throw new HttpError(400, 'This file does not appear to be a valid PDF.', 'INVALID_PDF');
  }
}

export async function extractPdfText(file) {
  validatePdfFile(file);
  const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
  try {
    const result = await parser.getText();
    const text = cleanText(result.text);
    if (text.length < 20) {
      throw new HttpError(
        422,
        'This PDF does not contain selectable text. Please upload a text-based PDF or paste the content manually. OCR is not included.',
        'NO_EXTRACTABLE_TEXT',
      );
    }
    return {
      text,
      pageCount: Number(result.total || result.pages?.length || 0),
      documentName: path.basename(file.originalname || 'uploaded.pdf'),
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const name = String(error?.name || '').toLowerCase();
    if (name.includes('password')) {
      throw new HttpError(422, 'This PDF is password-protected. Upload an unlocked copy.', 'PDF_PASSWORD');
    }
    throw new HttpError(
      422,
      'We could not extract text from this PDF. It may be damaged or unsupported; try another text-based PDF or paste the text.',
      'PDF_EXTRACTION_FAILED',
    );
  } finally {
    await parser.destroy().catch(() => {});
  }
}
