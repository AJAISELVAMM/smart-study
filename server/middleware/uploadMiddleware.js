import multer from 'multer';
import path from 'node:path';
import { config } from '../config.js';
import { HttpError } from '../utils.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const supportedMime = ['application/pdf', 'application/octet-stream'].includes(file.mimetype);
    if (extension !== '.pdf' || !supportedMime) {
      callback(new HttpError(415, 'Only PDF files are supported.', 'UNSUPPORTED_FILE_TYPE'));
      return;
    }
    callback(null, true);
  },
});

export const uploadPdf = upload.single('file');
