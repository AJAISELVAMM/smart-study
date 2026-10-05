import { useMemo, useState } from 'react';
import { Clipboard, Check, NotebookPen } from 'lucide-react';
import ContentText from './ContentText.jsx';
import DownloadButton from './DownloadButton.jsx';
import { copyToClipboard } from '../utils/helpers.js';

function notesToText(sections) {
  return sections.map((section) => [
    section.heading,
    section.content,
    ...(section.key_points || []).map((item) => `• ${item}`),
    ...(section.definitions || []).map((item) => `Definition: ${item}`),
    ...(section.examples || []).map((item) => `Example: ${item}`),
    ...(section.formulas || []).map((item) => `Formula: ${item}`),
    ...(section.exam_focus || []).map((item) => `Exam focus: ${item}`),
  ].filter(Boolean).join('\n')).join('\n\n');
}

export default function SmartNotes({ studyKit, sessionId }) {
  const sections = useMemo(() => studyKit?.smart_notes || [], [studyKit]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  async function handleCopy() {
    try {
      await copyToClipboard(notesToText(sections));
      setCopied(true);
      setCopyError('');
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) { setCopyError(error.message || 'Clipboard access was blocked.'); }
  }

  return (
    <div className="tab-content">
      <div className="tab-heading-row">
        <div><span className="section-kicker">ORGANIZED LEARNING</span><h2>Smart Notes</h2><p className="muted">Clear, structured notes generated from your source material.</p></div>
        <div className="tab-actions">
          <button className="button button-secondary" type="button" onClick={handleCopy}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? 'Copied' : 'Copy Notes'}</button>
          <DownloadButton sessionId={sessionId} type="notes" label="Download Notes PDF" />
        </div>
      </div>
      {sections.length ? sections.map((section, index) => (
        <article className="notes-card panel" key={`${section.heading}-${index}`}>
          <div className="notes-card-title"><span className="notes-number">{String(index + 1).padStart(2, '0')}</span><h3>{section.heading}</h3></div>
          {section.content && <ContentText text={section.content} />}
          {section.key_points?.length > 0 && <div className="notes-detail"><h4>Key Points</h4><ul className="clean-list">{section.key_points.map((item, itemIndex) => <li key={itemIndex}><span className="list-bullet" /><ContentText text={item} /></li>)}</ul></div>}
          {section.definitions?.length > 0 && <div className="note-chips"><strong>Definitions</strong>{section.definitions.map((item, itemIndex) => <div className="note-callout" key={itemIndex}><ContentText text={item} /></div>)}</div>}
          {section.examples?.length > 0 && <div className="notes-detail"><h4>Examples</h4>{section.examples.map((item, itemIndex) => <ContentText key={itemIndex} text={item} />)}</div>}
          {section.formulas?.length > 0 && <div className="notes-detail"><h4>Formulas</h4>{section.formulas.map((item, itemIndex) => <code className="formula-code" key={itemIndex}>{item}</code>)}</div>}
          {section.exam_focus?.length > 0 && <div className="exam-focus"><strong>Exam focus</strong>{section.exam_focus.map((item, itemIndex) => <ContentText key={itemIndex} text={item} />)}</div>}
        </article>
      )) : <div className="empty-state-small"><NotebookPen size={23} /><p>No structured notes were returned for this source.</p></div>}
      {copyError && <p className="field-error" role="alert">{copyError}</p>}
    </div>
  );
}
