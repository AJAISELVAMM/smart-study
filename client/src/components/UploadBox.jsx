import { useRef, useState } from 'react';
import { FileText, FileUp, Trash2, Type } from 'lucide-react';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export default function UploadBox({
  sourceMode, onSourceModeChange, file, onFileChange, text, onTextChange, disabled = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState('');

  function acceptFile(candidate) {
    setValidationError('');
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith('.pdf') || (candidate.type && !['application/pdf', 'application/octet-stream'].includes(candidate.type))) {
      onFileChange(null);
      setValidationError('Choose a PDF file. Other file types are not supported.');
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      onFileChange(null);
      setValidationError('This PDF is larger than the 25 MB upload limit.');
      return;
    }
    if (candidate.size === 0) {
      onFileChange(null);
      setValidationError('This PDF is empty. Choose another file.');
      return;
    }
    onFileChange(candidate);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  const fileSize = file ? (file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`) : '';

  return (
    <section className="panel input-panel">
      <div className="section-title-row">
        <div>
          <div className="section-kicker">STEP 1</div>
          <h2>Add your study material</h2>
          <p className="muted">Upload a text-based PDF or paste notes. You only need one source.</p>
        </div>
        <div className="input-switch" role="tablist" aria-label="Study material input method">
          <button type="button" role="tab" aria-selected={sourceMode === 'pdf'} className={sourceMode === 'pdf' ? 'selected' : ''} onClick={() => onSourceModeChange('pdf')} disabled={disabled}>
            <FileUp size={16} /> PDF upload
          </button>
          <button type="button" role="tab" aria-selected={sourceMode === 'text'} className={sourceMode === 'text' ? 'selected' : ''} onClick={() => onSourceModeChange('text')} disabled={disabled}>
            <Type size={16} /> Paste text
          </button>
        </div>
      </div>

      {sourceMode === 'pdf' ? (
        <>
          <input
            ref={inputRef}
            className="visually-hidden"
            id="pdf-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => acceptFile(event.target.files?.[0])}
            disabled={disabled}
          />
          {file ? (
            <div className="selected-file">
              <span className="file-icon"><FileText size={21} /></span>
              <div className="file-details"><strong>{file.name}</strong><span>PDF · {fileSize}</span></div>
              <button type="button" className="icon-button danger" aria-label="Remove uploaded PDF" onClick={() => { onFileChange(null); if (inputRef.current) inputRef.current.value = ''; }} disabled={disabled}>
                <Trash2 size={17} />
              </button>
            </div>
          ) : (
            <div
              className={`drop-zone${dragging ? ' drag-over' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => { if (!disabled) inputRef.current?.click(); }}
              onKeyDown={(event) => { if (!disabled && (event.key === 'Enter' || event.key === ' ')) inputRef.current?.click(); }}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label="Choose a PDF file or drop it here"
              aria-disabled={disabled}
            >
              <span className="upload-icon"><FileUp size={23} /></span>
              <strong>Drop your PDF here, or <span>browse files</span></strong>
              <small>Text-based PDF · Up to 25 MB</small>
            </div>
          )}
          {validationError && <p className="field-error" role="alert">{validationError}</p>}
          <div className="upload-footnote">
            <span>Scanned/image-only PDFs are not supported in this MVP.</span>
            <a href="/sample_pdfs/computer_networks_intro.pdf" download="computer_networks_intro.pdf">Download sample PDF</a>
          </div>
        </>
      ) : (
        <>
          <textarea
            className="study-textarea"
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder={'Paste your lecture notes, textbook content, research material or study notes here...'}
            rows={9}
            disabled={disabled}
            aria-label="Paste your study material"
          />
          <div className="text-meta"><span>{text.trim().length.toLocaleString()} characters · {text.trim() ? text.trim().split(/\s+/).length.toLocaleString() : 0} words</span>
            {text && <button type="button" className="text-button" onClick={() => onTextChange('')} disabled={disabled}>Clear text</button>}
          </div>
          {text.trim().length < 80 && <p className="field-hint">Add at least 80 characters to enable Study Kit generation{ text.trim().length ? ` · ${80 - text.trim().length} more needed` : '' }.</p>}
        </>
      )}
      <div className="source-note">Your source is stored with the generated session in the local SQLite database for grounded Ask AI and History.</div>
    </section>
  );
}
