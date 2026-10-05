export class JsonResponseError extends Error {
  constructor(message = 'The AI response could not be read as structured JSON.') {
    super(message);
    this.name = 'JsonResponseError';
  }
}

function stripFences(value) {
  return String(value || '')
    .replace(/^\s*```(?:json|javascript|js)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .replace(/^\uFEFF/, '')
    .trim();
}

function extractJsonObject(text) {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        try {
          const parsed = JSON.parse(text.slice(start, index + 1));
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        } catch {
          start = -1;
        }
      }
    }
  }
  throw new JsonResponseError();
}

export function parseJsonObject(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  const text = stripFences(raw);
  if (!text) throw new JsonResponseError('The AI returned an empty response.');
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    return extractJsonObject(text);
  }
  throw new JsonResponseError();
}

const textValue = (value) => typeof value === 'string' ? value.trim() : (typeof value === 'number' ? String(value) : '');

function textArray(value) {
  if (typeof value === 'string') return value.split(/\r?\n/).map((line) => line.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean);
  return Array.isArray(value) ? value.map(textValue).filter(Boolean) : [];
}

function normalizeNotes(value) {
  const source = Array.isArray(value) ? value : (value?.sections || value?.smart_notes || []);
  return source.flatMap((item) => {
    if (typeof item === 'string') return item.trim() ? [{ heading: 'Study Notes', content: item.trim(), key_points: [], definitions: [], examples: [], formulas: [], exam_focus: [] }] : [];
    if (!item || typeof item !== 'object') return [];
    const heading = textValue(item.heading || item.title || item.name) || 'Study Notes';
    let content = textValue(item.content || item.description || item.body);
    if (!content && Array.isArray(item.content)) content = textArray(item.content).map((point) => `- ${point}`).join('\n');
    const section = {
      heading,
      content,
      key_points: textArray(item.key_points || item.bullet_points || item.points),
      definitions: textArray(item.definitions),
      examples: textArray(item.examples),
      formulas: textArray(item.formulas),
      exam_focus: textArray(item.exam_focus),
    };
    return (section.content || section.key_points.length || section.definitions.length || section.exam_focus.length) ? [section] : [];
  });
}

export function normalizeStudyKit(raw, documentName = 'Study material') {
  const data = parseJsonObject(raw);
  const summarySource = typeof data.summary === 'string' ? { overview: data.summary } : (data.summary || {});
  const kit = {
    title: textValue(data.title || data.document_title) || documentName || 'Study material',
    summary: {
      overview: textValue(summarySource.overview || summarySource.two_minute_summary),
      key_concepts: textArray(summarySource.key_concepts || summarySource.concepts),
      main_takeaways: textArray(summarySource.main_takeaways || summarySource.takeaways),
      important_facts: textArray(summarySource.important_facts || summarySource.facts),
      formulas: textArray(summarySource.formulas || summarySource.important_formulas),
    },
    smart_notes: normalizeNotes(data.smart_notes || data.notes || []),
    flashcards: Array.isArray(data.flashcards) ? data.flashcards.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const question = textValue(item.question || item.front);
      const answer = textValue(item.answer || item.back);
      return question && answer ? [{
        question,
        answer,
        topic: textValue(item.topic),
        difficulty: textValue(item.difficulty),
      }] : [];
    }) : [],
    glossary: Array.isArray(data.glossary) ? data.glossary.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const term = textValue(item.term || item.word);
      const meaning = textValue(item.meaning || item.definition || item.explanation);
      return term && meaning ? [{ term, meaning, example: textValue(item.example || item.context) }] : [];
    }) : [],
    exam_questions: Array.isArray(data.exam_questions || data.questions)
      ? (data.exam_questions || data.questions).flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const question = textValue(item.question || item.prompt);
        if (!question) return [];
        const rawMarks = Number(item.marks);
        return [{
          question,
          marks: Number.isFinite(rawMarks) ? Math.max(0, Math.trunc(rawMarks)) : 0,
          difficulty: textValue(item.difficulty),
          topic: textValue(item.topic),
          type: textValue(item.type || item.category) || 'Important Question',
          answer: textValue(item.answer || item.explanation),
          explanation: textValue(item.explanation || item.answer),
        }];
      })
      : [],
  };
  if (!hasStudyContent(kit)) throw new JsonResponseError('The AI response did not include usable study content.');
  return kit;
}

export function hasStudyContent(kit) {
  return Boolean(kit?.summary?.overview || kit?.summary?.key_concepts?.length || kit?.smart_notes?.length
    || kit?.flashcards?.length || kit?.glossary?.length || kit?.exam_questions?.length);
}

export function missingRequiredModules(kit) {
  const missing = [];
  if (!kit?.summary?.overview && !kit?.summary?.key_concepts?.length && !kit?.summary?.main_takeaways?.length) missing.push('summary');
  if (!kit?.smart_notes?.some((section) => section.content || section.key_points?.length || section.definitions?.length)) missing.push('smart notes');
  if (!kit?.flashcards?.length) missing.push('flashcards');
  if (!kit?.glossary?.length) missing.push('glossary');
  if (!kit?.exam_questions?.length) missing.push('exam questions');
  return missing;
}
