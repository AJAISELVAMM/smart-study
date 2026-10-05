import { HttpError } from '../utils.js';
import { buildChatPrompt } from '../prompts/chatPrompt.js';
import { systemPromptForMode } from '../prompts/systemPrompt.js';
import { generateTextContent } from './geminiService.js';
import { chunkText } from './textChunker.js';
import { getSessionForChat, saveChatTurn } from '../database/repository.js';

const MAX_QUESTION_CHARS = 2_000;
const STOP_WORDS = new Set(['about', 'after', 'again', 'also', 'and', 'are', 'because', 'been', 'being', 'could', 'does', 'explain', 'for', 'from', 'give', 'have', 'into', 'like', 'most', 'only', 'please', 'should', 'some', 'that', 'their', 'them', 'there', 'these', 'this', 'those', 'what', 'when', 'where', 'which', 'with', 'your', 'topic', 'concept']);

function compactKit(studyKit) {
  return JSON.stringify({
    title: studyKit.title,
    summary: studyKit.summary,
    smart_notes: studyKit.smart_notes,
    glossary: studyKit.glossary?.slice(0, 12),
    flashcards: studyKit.flashcards?.slice(0, 8),
    exam_questions: studyKit.exam_questions?.slice(0, 6),
  }, null, 2).slice(0, 24_000);
}

function selectRelevantPassages(sourceText, question, recentMessages) {
  const query = `${question} ${recentMessages.slice(-4).map((item) => item.content).join(' ')}`;
  const terms = [...new Set((query.toLowerCase().match(/[a-z0-9][a-z0-9_+-]{1,}/g) || []).filter((term) => !STOP_WORDS.has(term)))];
  const chunks = chunkText(sourceText, { maxChars: 6_000, overlapChars: 500 });
  const scored = chunks.map((chunk, index) => ({
    chunk,
    index,
    score: terms.reduce((total, term) => total + chunk.toLowerCase().split(term).length - 1, 0),
  }));
  const selected = scored.sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 4).sort((a, b) => a.index - b.index);
  return selected.map(({ chunk }) => chunk).join('\n\n[Relevant source passage]\n');
}

function buildContext(sourceText, studyKit, question, recentMessages) {
  const derived = compactKit(studyKit);
  if (sourceText.length <= 28_000) return `ORIGINAL STUDY MATERIAL\n${sourceText}\n\nSOURCE-DERIVED STUDY KIT\n${derived}`.slice(0, 58_000);
  const passages = selectRelevantPassages(sourceText, question, recentMessages);
  return `SOURCE-DERIVED STUDY KIT\n${derived}\n\nSELECTED ORIGINAL SOURCE PASSAGES\n${passages}`.slice(0, 56_000);
}

export async function answerStudyQuestion({ sessionId, question }) {
  const numericId = Number(sessionId);
  const normalizedQuestion = String(question || '').trim();
  if (!Number.isSafeInteger(numericId) || numericId < 1) throw new HttpError(400, 'Choose a saved Study Kit first.', 'INVALID_SESSION_ID');
  if (!normalizedQuestion) throw new HttpError(400, 'Type a question about your study material first.', 'EMPTY_QUESTION');
  if (normalizedQuestion.length > MAX_QUESTION_CHARS) throw new HttpError(400, `Keep your question under ${MAX_QUESTION_CHARS.toLocaleString()} characters.`, 'QUESTION_TOO_LONG');

  const data = await getSessionForChat(numericId);
  if (!data) throw new HttpError(404, 'That study session could not be found.', 'SESSION_NOT_FOUND');
  const { session, sourceText, messages } = data;
  const context = buildContext(sourceText, session.studyKit, normalizedQuestion, messages);
  const prompt = buildChatPrompt({
    question: normalizedQuestion,
    sourceContext: context,
    learningMode: session.learningMode,
    recentMessages: messages.slice(-8).map((message) => ({ role: message.role, content: message.content || message.message })),
  });
  const answer = await generateTextContent(prompt, {
    systemInstruction: systemPromptForMode(session.learningMode, 'source-grounded question answering'),
    maxOutputTokens: 1800,
  });
  const updatedMessages = await saveChatTurn(numericId, normalizedQuestion, answer);
  return { answer, chatMessages: updatedMessages };
}
