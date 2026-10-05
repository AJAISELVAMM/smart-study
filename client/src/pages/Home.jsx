import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, ChevronRight, Download, Layers3 } from 'lucide-react';
import Header from '../components/Header.jsx';
import UploadBox from '../components/UploadBox.jsx';
import LearningMode from '../components/LearningMode.jsx';
import GenerateButton from '../components/GenerateButton.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Summary from '../components/Summary.jsx';
import SmartNotes from '../components/SmartNotes.jsx';
import Flashcards from '../components/Flashcards.jsx';
import Glossary from '../components/Glossary.jsx';
import ExamQuestions from '../components/ExamQuestions.jsx';
import AskAI from '../components/AskAI.jsx';
import DownloadButton from '../components/DownloadButton.jsx';
import { api, getErrorMessage } from '../services/api.js';
import { useStudy } from '../context/StudyContext.jsx';
import { MODE_DESCRIPTIONS } from '../utils/helpers.js';

const tabs = [
  { id: 'summary', label: 'Summary' },
  { id: 'notes', label: 'Smart Notes' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'questions', label: 'Exam Questions' },
  { id: 'ask', label: 'Ask AI' },
];

export default function Home() {
  const { activeSession, setActiveSession, learningMode, setLearningMode } = useStudy();
  const [sourceMode, setSourceMode] = useState('pdf');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [keyConfigured, setKeyConfigured] = useState(null);

  useEffect(() => {
    api.get('/health').then((response) => setKeyConfigured(Boolean(response.data.data.aiConfigured))).catch(() => setKeyConfigured(null));
  }, []);

  const canGenerate = useMemo(() => sourceMode === 'pdf'
    ? Boolean(file)
    : text.trim().length >= 80, [sourceMode, file, text]);

  async function generate() {
    if (!canGenerate || loading) {
      if (sourceMode === 'text' && text.trim().length < 80) setError('Please paste at least 80 characters of study material.');
      return;
    }
    setLoading(true);
    setError('');
    setUploadProgress(0);
    setLoadingPhase(sourceMode === 'pdf' ? 'Uploading your PDF…' : 'Sending study material…');

    try {
      let response;
      if (sourceMode === 'pdf') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('learningMode', learningMode);
        response = await api.post('/study/generate', formData, {
          onUploadProgress(event) {
            if (!event.total) return;
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
            if (percent >= 100) setLoadingPhase('PDF uploaded — extracting text and building your Study Kit…');
          },
        });
      } else {
        setLoadingPhase('Analyzing your study material with Gemini…');
        response = await api.post('/study/generate', {
          text,
          documentName: 'Pasted study material',
          sourceType: 'text',
          learningMode,
        });
      }
      const data = response.data.data;
      setActiveSession({ ...data, chatMessages: [] });
      setActiveTab('summary');
      setKeyConfigured(true);
    } catch (requestError) {
      setError(await getErrorMessage(requestError));
      if (String(requestError?.response?.data?.code || '').startsWith('AI_')) setKeyConfigured(false);
    } finally {
      setLoading(false);
      setLoadingPhase('');
      setUploadProgress(0);
    }
  }

  function renderActiveTab() {
    if (!activeSession) return null;
    const props = { studyKit: activeSession.studyKit, sessionId: activeSession.sessionId || activeSession.id };
    switch (activeTab) {
      case 'notes': return <SmartNotes {...props} />;
      case 'flashcards': return <Flashcards {...props} />;
      case 'glossary': return <Glossary {...props} />;
      case 'questions': return <ExamQuestions {...props} />;
      case 'ask': return <AskAI sessionId={props.sessionId} />;
      default: return <Summary {...props} />;
    }
  }

  return (
    <div className="page home-page">
      <Header
        eyebrow="ONE SOURCE · A COMPLETE LEARNING WORKFLOW"
        title="Smart Study Companion"
        subtitle="Turn your study material into an exam-ready learning kit."
        action={<span className="header-step"><span className="step-dot">01</span> Upload once <ArrowRight size={14} /> Learn smarter</span>}
      />

      {keyConfigured === false && <div className="key-notice"><span className="notice-dot" /><div><strong>Gemini setup needed</strong><p>Add <code>GEMINI_API_KEY</code> to <code>server/.env</code> to enable generation and Ask AI. The key stays server-side.</p></div></div>}
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="workflow-grid">
        <UploadBox
          sourceMode={sourceMode}
          onSourceModeChange={setSourceMode}
          file={file}
          onFileChange={setFile}
          text={text}
          onTextChange={setText}
          disabled={loading}
        />
        <LearningMode value={learningMode} onChange={setLearningMode} disabled={loading} />
      </div>

      {loading && <LoadingState label={loadingPhase || 'Analyzing your material…'} detail={sourceMode === 'pdf' && uploadProgress > 0 && uploadProgress < 100 ? `Uploading PDF · ${uploadProgress}%` : 'The API is processing your source. This may take a moment for long documents.'} />}
      <div className="generate-row">
        <GenerateButton onClick={generate} disabled={!canGenerate} loading={loading} />
        <span className="generate-hint"><span className="status-dot" />{MODE_DESCRIPTIONS[learningMode]}</span>
      </div>

      {!activeSession && !loading && (
        <div className="first-kit-card panel">
          <span className="first-kit-icon"><BookOpenCheck size={22} /></span>
          <div><strong>One upload → a complete study workflow</strong><p>Summary, organized notes, active-recall cards, glossary, exam questions, and grounded AI support.</p></div>
          <div className="first-kit-flow"><span>Understand</span><ChevronRight size={14} /><span>Recall</span><ChevronRight size={14} /><span>Practice</span></div>
        </div>
      )}

      {activeSession && (
        <section className="study-output" aria-label="Generated study kit">
          <div className="output-title-row">
            <div><div className="section-kicker">YOUR PERSONALIZED TOOLKIT</div><h2>{activeSession.studyKit?.title || activeSession.documentName}</h2><div className="output-meta"><span><Layers3 size={14} /> {activeSession.learningMode} mode</span><span>{activeSession.documentName}</span></div></div>
            <DownloadButton sessionId={activeSession.sessionId || activeSession.id} type="complete" label="Download Complete Study Kit" variant="primary" />
          </div>
          <div className="study-tabs" role="tablist" aria-label="Study Kit sections">
            {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={`study-tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
          </div>
          <div className="study-tab-panel" role="tabpanel">{renderActiveTab()}</div>
        </section>
      )}
    </div>
  );
}
