import { useEffect, useState } from 'react';
import { Check, Database, KeyRound, Moon, Sun, Trash2 } from 'lucide-react';
import Header from '../components/Header.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { LEARNING_MODES } from '../utils/helpers.js';
import { api, getErrorMessage } from '../services/api.js';

export default function Settings() {
  const { defaultLearningMode, setDefaultLearningMode, appearance, setAppearance, setActiveSession } = useStudy();
  const [keyStatus, setKeyStatus] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/health').then((response) => setKeyStatus(response.data.data)).catch(() => setKeyStatus({ status: 'unavailable', aiConfigured: false }));
  }, []);

  async function clearHistory() {
    setClearing(true);
    setError('');
    try {
      await api.delete('/history');
      setConfirmClear(false);
      setActiveSession(null);
      setNotice('All saved study sessions have been deleted.');
      window.setTimeout(() => setNotice(''), 2600);
    } catch (requestError) { setError(await getErrorMessage(requestError)); }
    finally { setClearing(false); }
  }

  return (
    <div className="page settings-page">
      <Header eyebrow="MAKE IT YOURS" title="Settings" subtitle="Set your study preference and manage local data." />
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      {notice && <div className="success-banner"><Check size={17} /> {notice}</div>}
      <div className="settings-grid">
        <section className="settings-card panel">
          <div className="settings-card-icon"><Sun size={19} /></div>
          <div className="settings-card-copy"><h2>Appearance</h2><p>Choose the workspace theme that feels right.</p></div>
          <div className="theme-toggle" role="group" aria-label="Appearance">
            <button type="button" className={appearance === 'Light' ? 'active' : ''} onClick={() => setAppearance('Light')}><Sun size={15} /> Light</button>
            <button type="button" className={appearance === 'Dark' ? 'active' : ''} onClick={() => setAppearance('Dark')}><Moon size={15} /> Dark</button>
          </div>
        </section>

        <section className="settings-card panel">
          <div className="settings-card-icon"><Check size={19} /></div>
          <div className="settings-card-copy"><h2>Default Learning Mode</h2><p>Used when you start a new study session.</p></div>
          <select className="settings-select" value={defaultLearningMode} onChange={(event) => setDefaultLearningMode(event.target.value)} aria-label="Default learning mode">
            {LEARNING_MODES.map((mode) => <option key={mode}>{mode}</option>)}
          </select>
        </section>

        <section className="settings-card panel settings-wide">
          <div className="settings-card-icon"><KeyRound size={19} /></div>
          <div className="settings-card-copy"><h2>Gemini API</h2><p>The API key is read by the server and never sent to React.</p></div>
          <div className={`api-status ${keyStatus?.aiConfigured ? 'configured' : 'not-configured'}`}><span className="status-dot" />{keyStatus?.aiConfigured ? 'Server key configured' : keyStatus?.status === 'unavailable' ? 'API server unavailable' : 'Key setup needed'}</div>
          {!keyStatus?.aiConfigured && keyStatus?.status !== 'unavailable' && <div className="settings-help">Add <code>GEMINI_API_KEY</code> to <code>server/.env</code>, then restart the backend.</div>}
        </section>

        <section className="settings-card panel settings-wide data-card">
          <div className="settings-card-icon"><Database size={19} /></div>
          <div className="settings-card-copy"><h2>Study Data</h2><p>Sessions and Ask AI messages are stored in the local SQLite database.</p><span className="settings-storage-note">Database: <code>server/database/study_companion.db</code></span></div>
          {confirmClear ? <div className="clear-confirm"><span>Delete all saved sessions and chat messages?</span><button type="button" className="button button-danger button-small" onClick={clearHistory} disabled={clearing}>{clearing ? 'Clearing…' : 'Confirm clear'}</button><button type="button" className="text-button" onClick={() => setConfirmClear(false)} disabled={clearing}>Cancel</button></div>
            : <button type="button" className="button button-danger" onClick={() => setConfirmClear(true)}><Trash2 size={16} /> Clear Study History</button>}
        </section>

        <section className="settings-card panel settings-wide about-card">
          <div className="settings-card-icon about-mark">✦</div>
          <div className="settings-card-copy"><h2>Smart Study Companion</h2><p>AI-powered study material transformation platform.</p><span className="settings-storage-note">One input → understand · recall · practice · revise</span></div>
        </section>
      </div>
    </div>
  );
}
