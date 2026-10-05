import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 180_000,
  headers: { Accept: 'application/json' },
});

function responseMessage(error) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    return data.text().then((content) => {
      try { return JSON.parse(content).error || 'The request could not be completed.'; }
      catch { return 'The request could not be completed.'; }
    });
  }
  return Promise.resolve(data?.error || error?.message || 'The server could not be reached. Check that the API server is running.');
}

export async function getErrorMessage(error) {
  return responseMessage(error);
}

export async function downloadPdf(sessionId, type) {
  const response = await api.post('/export/pdf', { sessionId, type }, { responseType: 'blob' });
  const disposition = response.headers['content-disposition'] || '';
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `study_kit_${type}.pdf`;
  return { blob: response.data, filename };
}
