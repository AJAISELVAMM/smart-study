import { config } from '../config.js';
import { HttpError } from '../utils.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'The requested API endpoint was not found.',
    code: 'NOT_FOUND',
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error instanceof HttpError ? error.statusCode : 500;
  let message = error instanceof HttpError ? error.message : 'Something went wrong. Please try again.';
  let code = error instanceof HttpError ? error.code : 'REQUEST_FAILED';

  if (error?.name === 'MulterError') {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    if (error.code === 'LIMIT_FILE_SIZE') {
      const limitMb = Math.ceil(config.maxUploadBytes / (1024 * 1024));
      message = `This PDF exceeds the ${limitMb} MB upload limit.`;
      code = 'FILE_TOO_LARGE';
    } else {
      message = 'The PDF upload could not be processed. Please try again.';
      code = 'UPLOAD_FAILED';
    }
  } else if (error?.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body must contain valid JSON or form data.';
    code = 'INVALID_REQUEST_BODY';
  } else if (error?.type === 'entity.too.large') {
    status = 413;
    message = 'The request body exceeds the server limit.';
    code = 'REQUEST_TOO_LARGE';
  }

  if (error?.name === 'SequelizeDatabaseError' || error?.name === 'SequelizeConnectionError') {
    status = 503;
    message = 'The local study database is unavailable. Restart the API server and try again.';
    code = 'DATABASE_UNAVAILABLE';
  }

  if (status >= 500) {
    console.error(`[api] ${error?.name || 'Error'}: ${error?.message || 'unknown error'}`);
  }
  res.status(status).json({ success: false, error: message, code });
}
