import { useState } from 'react';
import { Clipboard, Check, FileText } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';
import ContentText from './ContentText.jsx';
import { copyToClipboard } from '../utils/helpers.js';

function copySummary(summary) {
  const rows = ['2-Minute Overview', '', summary.overview || ''];
  for (const [key, label] of [['key_concepts', 'Key Concepts'], ['main_takeaways', 'Main Takeaways'], ['important_facts', 'Important Facts'], ['formulas', 'Important Formulas']]) {
    if (summary[key]?.length) rows.push('', label, ...summary[key].map((item) => `• ${item}`));
  }
  return rows.join('\n');
}

export default function Summary({ studyKit, sessionId }) {
  const summary = studyKit?.summary || {};
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const sections = [
    ['key_concepts', 'Key Concepts'],
    ['main_takeaways', 'Main Takeaways'],
    ['important_facts', 'Important Facts'],
    ['formulas', 'Important Formulas'],
  ].filter(([key]) => summary[key]?.length);

  async function handleCopy() {
    try {
      await copyToClipboard(copySummary(summary));
      setCopied(true);
      setCopyError('');
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      setCopyError(error.message || 'Clipboard access was blocked.');
    }
  }

  return (
    <div className="tab-content">
      <div className="tab-heading-row">
        <div><span className="section-kicker">QUICK REVIEW</span><h2>2-Minute Overview</h2><p className="muted">A concise guide to the material’s central ideas.</p></div>
        <div className="tab-actions">
          <button className="button button-secondary" type="button" onClick={handleCopy}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? 'Copied' : 'Copy'}</button>
          <DownloadButton sessionId={sessionId} type="summary" label="Download Summary PDF" />
        </div>
      </div>
      {summary.overview ? (
        <article className="summary-overview panel-soft"><div className="overview-icon"><FileText size={18} /></div><div><h3>Overview</h3><ContentText text={summary.overview} /></div></article>
      ) : <div className="empty-inline">No separate overview was returned for this session.</div>}
      {sections.length > 0 && <div className="summary-grid">
        {sections.map(([key, label]) => (
          <section className={`summary-section panel-soft${key === 'main_takeaways' ? ' highlight' : ''}`} key={key}>
            <h3>{label}</h3>
            <ul className="clean-list">{summary[key].map((item, index) => <li key={`${key}-${index}`}><span className="list-bullet" /> <ContentText text={item} /></li>)}</ul>
          </section>
        ))}
      </div>}
      {copyError && <p className="field-error" role="alert">{copyError}</p>}
    </div>
  );
}
