import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadPdf, getErrorMessage } from '../services/api.js';
import { downloadBlob } from '../utils/helpers.js';

export default function DownloadButton({ sessionId, type, label, variant = 'secondary' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (!sessionId || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await downloadPdf(sessionId, type);
      downloadBlob(result.blob, result.filename);
    } catch (requestError) {
      setError(await getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="download-control">
      <button type="button" className={`button button-${variant}`} onClick={handleDownload} disabled={!sessionId || loading}>
        {loading ? <span className="mini-spinner" aria-hidden="true" /> : <Download size={16} />}
        <span>{loading ? 'Preparing PDF…' : label}</span>
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </div>
  );
}
