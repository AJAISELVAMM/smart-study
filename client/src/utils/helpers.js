export const LEARNING_MODES = ['Beginner', 'Standard', 'Exam Revision'];

export const MODE_DESCRIPTIONS = {
  Beginner: 'Simple explanations, clear definitions, and gentle introductions.',
  Standard: 'Balanced detail with clear explanations and useful examples.',
  'Exam Revision': 'High-yield concepts, concise revision, and exam-focused practice.',
};

export function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (left, right) => left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  if (sameDay(date, today)) return `Today, ${time}`;
  if (sameDay(date, yesterday)) return `Yesterday, ${time}`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export function safeFileName(value) {
  return String(value || 'study_material').replace(/[^a-z0-9._-]+/gi, '_').replace(/^[_\-.]+|[_\-.]+$/g, '').slice(0, 64) || 'study_material';
}

export function isToday(value) {
  const date = new Date(value);
  const today = new Date();
  return !Number.isNaN(date.getTime()) && date.toDateString() === today.toDateString();
}

export function isThisWeek(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return date >= start;
}

export async function copyToClipboard(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(String(value || ''));
    return;
  }
  const field = document.createElement('textarea');
  field.value = String(value || '');
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Clipboard permission was denied.');
}
