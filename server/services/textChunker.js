export function splitLongParagraph(paragraph, maxChars) {
  const sentences = paragraph.match(/[^.!?]+(?:[.!?]+|$)/g) || [paragraph];
  const result = [];
  let current = '';

  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim();
    if (!sentence) continue;
    if (sentence.length > maxChars) {
      if (current) result.push(current);
      current = '';
      let words = sentence.split(/\s+/);
      let part = '';
      for (let word of words) {
        while (word.length > maxChars) {
          if (part) result.push(part);
          result.push(word.slice(0, maxChars));
          word = word.slice(maxChars);
          part = '';
        }
        const candidate = `${part} ${word}`.trim();
        if (candidate.length > maxChars) {
          if (part) result.push(part);
          part = word;
        } else part = candidate;
      }
      if (part) result.push(part);
      continue;
    }
    const candidate = `${current} ${sentence}`.trim();
    if (candidate.length <= maxChars) current = candidate;
    else {
      if (current) result.push(current);
      current = sentence;
    }
  }
  if (current) result.push(current);
  return result;
}

function overlapTail(text, overlapChars) {
  if (!overlapChars || text.length <= overlapChars) return '';
  let start = text.length - overlapChars;
  const boundary = text.indexOf(' ', start);
  if (boundary !== -1 && boundary < text.length - 1) start = boundary + 1;
  return text.slice(start).trim();
}

export function chunkText(input, { maxChars = 18_000, overlapChars = 1_000 } = {}) {
  const text = String(input || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return [];
  if (maxChars < 100) throw new Error('maxChars must be at least 100.');
  const overlap = Math.max(0, Math.min(overlapChars, Math.floor(maxChars / 3)));
  if (text.length <= maxChars) return [text];

  const blocks = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
    .flatMap((paragraph) => splitLongParagraph(paragraph, maxChars));
  const chunks = [];
  let current = '';
  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current.trim());
    const carry = overlapTail(current, overlap);
    current = carry && carry.length + block.length + 2 <= maxChars
      ? `${carry}\n\n${block}`
      : block;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap((chunk) => chunk.length <= maxChars
    ? [chunk]
    : splitLongParagraph(chunk.replace(/\n\n/g, ' '), maxChars));
}
