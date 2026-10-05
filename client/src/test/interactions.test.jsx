import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../services/api.js';
import { downloadBlob } from '../utils/helpers.js';
import Sidebar from '../components/Sidebar.jsx';
import UploadBox from '../components/UploadBox.jsx';
import LearningMode from '../components/LearningMode.jsx';
import Flashcards from '../components/Flashcards.jsx';
import Glossary from '../components/Glossary.jsx';
import DownloadButton from '../components/DownloadButton.jsx';
import GenerateButton from '../components/GenerateButton.jsx';
import Home from '../pages/Home.jsx';
import Settings from '../pages/Settings.jsx';
import HistoryList from '../components/HistoryList.jsx';
import { StudyProvider } from '../context/StudyContext.jsx';

vi.mock('../services/api.js', () => {
  const api = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
  return {
    api,
    getErrorMessage: vi.fn(async (error) => error?.message || 'The request failed.'),
    downloadPdf: vi.fn(async (sessionId, type) => {
      const response = await api.post('/export/pdf', { sessionId, type }, { responseType: 'blob' });
      const disposition = response.headers?.['content-disposition'] || '';
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `study_kit_${type}.pdf`;
      return { blob: response.data, filename };
    }),
  };
});

vi.mock('../utils/helpers.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, downloadBlob: vi.fn() };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.dataset.theme = 'light';
});

const studyKit = {
  flashcards: [
    { question: 'What is a node?', answer: 'A connected device.', topic: 'Basics', difficulty: 'Easy' },
    { question: 'What is a protocol?', answer: 'A communication rule set.', topic: 'Basics', difficulty: 'Medium' },
  ],
  glossary: [
    { term: 'Ethernet', meaning: 'A wired networking technology.', example: '' },
    { term: 'Protocol', meaning: 'Rules used to communicate.', example: 'TCP is a protocol.' },
  ],
};

describe('working interactive controls', () => {
  it('keeps the primary navigation to Home, History, and Settings', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(navigation.querySelectorAll('a')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute('href', '/history');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });

  it('accepts a PDF and gives accessible feedback for a different file type', () => {
    const onFileChange = vi.fn();
    render(<UploadBox sourceMode="pdf" onSourceModeChange={vi.fn()} file={null} onFileChange={onFileChange} text="" onTextChange={vi.fn()} />);
    const input = document.querySelector('#pdf-input');
    const pdf = new File(['%PDF sample'], 'lecture.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(onFileChange).toHaveBeenLastCalledWith(pdf);

    const invalid = new File(['plain text'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [invalid] } });
    expect(onFileChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a PDF file');
  });

  it('changes the selected learning mode when a mode card is activated', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LearningMode value="Beginner" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: /Beginner/ })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: /Exam Revision/ }));
    expect(onChange).toHaveBeenCalledWith('Exam Revision');
  });

  it('enables and activates the Generate Study Kit control only when requested', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<GenerateButton onClick={onClick} disabled />);
    const button = screen.getByRole('button', { name: 'Generate Study Kit' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    rerender(<GenerateButton onClick={onClick} disabled={false} loading={false} />);
    await user.click(screen.getByRole('button', { name: 'Generate Study Kit' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('submits pasted text and renders the returned kit inside Home tabs', async () => {
    const user = userEvent.setup();
    localStorage.clear();
    const returnedKit = {
      title: 'Computer Networks — Foundations',
      summary: { overview: 'A computer network links devices so that they can communicate and share resources.', key_concepts: ['Nodes exchange data using protocols.'], main_takeaways: ['Networks share resources.'], important_facts: [], formulas: [] },
      smart_notes: [], flashcards: studyKit.flashcards, glossary: studyKit.glossary,
      exam_questions: [{ question: 'Define a computer network.', marks: 2, difficulty: 'Easy', topic: 'Basics', type: 'Short Answer', answer: 'A set of connected devices.', explanation: 'The devices communicate and share resources.' }],
    };
    api.get.mockResolvedValue({ data: { data: { aiConfigured: true } } });
    api.post.mockResolvedValue({ data: { data: { sessionId: 31, documentName: 'Pasted study material', sourceType: 'text', learningMode: 'Beginner', studyKit: returnedKit } } });
    render(<StudyProvider><Home /></StudyProvider>);
    await user.click(screen.getByRole('tab', { name: 'Paste text' }));
    const source = 'A computer network links computers and other devices so they can exchange data and share resources. Communication protocols define how connected devices send and receive information.';
    await user.type(screen.getByRole('textbox', { name: 'Paste your study material' }), source);
    const generateButton = screen.getByRole('button', { name: 'Generate Study Kit' });
    expect(generateButton).toBeEnabled();
    await user.click(generateButton);
    await screen.findByRole('heading', { name: 'Computer Networks — Foundations' });
    expect(api.post).toHaveBeenCalledWith('/study/generate', expect.objectContaining({ text: source, learningMode: 'Beginner' }));
    expect(screen.getByText(/A computer network links devices/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Exam Questions' }));
    expect(screen.getByText('Define a computer network.')).toBeInTheDocument();
  });

  it('sends a selected PDF and the learning mode as multipart form data', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { data: { aiConfigured: true } } });
    api.post.mockResolvedValue({ data: { data: { sessionId: 32, documentName: 'lecture.pdf', sourceType: 'pdf', learningMode: 'Beginner', studyKit: { title: 'PDF Study Kit', summary: { overview: 'Extracted source summary.', key_concepts: [], main_takeaways: [], important_facts: [], formulas: [] } } } } });
    render(<StudyProvider><Home /></StudyProvider>);
    const file = new File(['%PDF-1.7 sample'], 'lecture.pdf', { type: 'application/pdf' });
    fireEvent.change(document.querySelector('#pdf-input'), { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: 'Generate Study Kit' }));
    await screen.findByRole('heading', { name: 'PDF Study Kit' });
    const [url, formData, options] = api.post.mock.calls[0];
    expect(url).toBe('/study/generate');
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('file')).toEqual(file);
    expect(formData.get('learningMode')).toBe('Beginner');
    expect(options.onUploadProgress).toEqual(expect.any(Function));
  });

  it('reveals a flashcard answer and advances to the next card', async () => {
    const user = userEvent.setup();
    render(<Flashcards studyKit={studyKit} sessionId={13} />);
    expect(screen.getByText('What is a node?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    expect(screen.getByText('A connected device.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('What is a protocol?')).toBeInTheDocument();
    expect(screen.queryByText('A communication rule set.')).not.toBeInTheDocument();
  });

  it('filters glossary entries as the student types', async () => {
    const user = userEvent.setup();
    render(<Glossary studyKit={studyKit} sessionId={13} />);
    expect(screen.getByText('Ethernet')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search glossary terms' }), 'ethernet');
    expect(screen.getByText('Ethernet')).toBeInTheDocument();
    expect(screen.queryByText('Protocol', { selector: 'h3' })).not.toBeInTheDocument();
  });

  it('downloads a section PDF by calling the export endpoint', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({
      data: new Blob(['%PDF test']),
      headers: { 'content-disposition': 'attachment; filename="computer_networks_summary.pdf"' },
    });
    render(<DownloadButton sessionId={13} type="summary" label="Download Summary PDF" />);
    await user.click(screen.getByRole('button', { name: 'Download Summary PDF' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/export/pdf', { sessionId: 13, type: 'summary' }, { responseType: 'blob' }));
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'computer_networks_summary.pdf');
  });

  it('reopens a saved session from History and navigates back to Home', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation(async (url) => {
      if (url === '/history') return { data: { data: { sessions: [{ id: 9, documentName: 'Computer Networks', sourceType: 'pdf', learningMode: 'Standard', createdAt: new Date().toISOString() }], hasMore: false, nextOffset: null } } };
      if (url === '/history/9') return { data: { data: { id: 9, documentName: 'Computer Networks', learningMode: 'Standard', studyKit: { title: 'Reopened Kit' }, chatMessages: [] } } };
      throw new Error(`Unexpected request: ${url}`);
    });
    render(
      <StudyProvider>
        <MemoryRouter initialEntries={['/history']}>
          <Routes>
            <Route path="/history" element={<HistoryList />} />
            <Route path="/" element={<div>Opened at Home</div>} />
          </Routes>
        </MemoryRouter>
      </StudyProvider>,
    );
    await user.click(await screen.findByRole('button', { name: 'Open Study Kit' }));
    expect(await screen.findByText('Opened at Home')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/history/9');
  });

  it('saves learning preferences and clears study data from Settings', async () => {
    const user = userEvent.setup();
    localStorage.clear();
    api.get.mockResolvedValue({ data: { data: { status: 'ok', aiConfigured: false } } });
    api.delete.mockResolvedValue({ data: { success: true } });
    render(<StudyProvider><Settings /></StudyProvider>);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Default learning mode' }), 'Exam Revision');
    expect(localStorage.getItem('ssc-learning-mode')).toBe('Exam Revision');
    await user.click(screen.getByRole('button', { name: /Dark/ }));
    expect(localStorage.getItem('ssc-appearance')).toBe('Dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.click(screen.getByRole('button', { name: 'Clear Study History' }));
    await user.click(screen.getByRole('button', { name: 'Confirm clear' }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/history'));
    expect(screen.getByText('All saved study sessions have been deleted.')).toBeInTheDocument();
  });

  it('requires confirmation before deleting a saved history entry', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: { data: { sessions: [{ id: 12, documentName: 'Networks', sourceType: 'text', learningMode: 'Beginner', createdAt: new Date().toISOString() }], hasMore: false, nextOffset: null } } });
    api.delete.mockResolvedValue({ data: { success: true } });
    render(<StudyProvider><MemoryRouter><HistoryList /></MemoryRouter></StudyProvider>);
    await user.click(await screen.findByRole('button', { name: 'Delete Networks' }));
    expect(screen.getByText(/Delete this saved session/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/history/12'));
  });
});
