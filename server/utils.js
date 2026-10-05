export class HttpError extends Error {
  constructor(statusCode, message, code = 'REQUEST_FAILED') {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function safeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}
