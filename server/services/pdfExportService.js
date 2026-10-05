import PDFDocument from 'pdfkit';
import { config } from '../config.js';

const COLORS = { purple: '#5949C8', ink: '#22233A', muted: '#687087', line: '#E7E5F2' };
const text = (value) => typeof value === 'string' ? value : (value == null ? '' : String(value));

function cleanInline(value) {
  return text(value).replace(/\*\*/g, '').replace(/`/g, '').replace(/^#{1,4}\s+/gm, '').trim();
}

function addBullets(doc, items) {
  for (const item of items || []) {
    const value = cleanInline(item);
    if (value) doc.text(`•  ${value}`, { indent: 10, hanging: 4, paragraphGap: 3 });
  }
}

function addHeading(doc, heading) {
  doc.moveDown(0.45).font('Helvetica-Bold').fontSize(15).fillColor(COLORS.purple).text(cleanInline(heading), { lineGap: 2 });
  doc.moveDown(0.18).font('Helvetica').fontSize(10).fillColor(COLORS.ink);
}

function addBody(doc, value) {
  const clean = cleanInline(value);
  if (clean) doc.font('Helvetica').fontSize(10).fillColor(COLORS.ink).text(clean, { lineGap: 3, paragraphGap: 5 });
}

function appendSummary(doc, kit) {
  const summary = kit.summary || {};
  addHeading(doc, '2-Minute Summary');
  if (summary.overview) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.ink).text('Overview');
    addBody(doc, summary.overview);
  }
  for (const [key, label] of [['key_concepts', 'Key Concepts'], ['main_takeaways', 'Main Takeaways'], ['important_facts', 'Important Facts'], ['formulas', 'Important Formulas']]) {
    if (summary[key]?.length) {
      doc.moveDown(0.2).font('Helvetica-Bold').fontSize(10.5).fillColor(COLORS.ink).text(label);
      addBullets(doc, summary[key]);
    }
  }
}

function appendNotes(doc, kit) {
  addHeading(doc, 'Smart Notes');
  for (const section of kit.smart_notes || []) {
    doc.moveDown(0.25).font('Helvetica-Bold').fontSize(11.5).fillColor(COLORS.ink).text(cleanInline(section.heading || 'Study Notes'));
    addBody(doc, section.content);
    for (const [key, label] of [['key_points', 'Key Points'], ['definitions', 'Definitions'], ['examples', 'Examples'], ['formulas', 'Formulas'], ['exam_focus', 'Exam Focus']]) {
      if (section[key]?.length) {
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.ink).text(label);
        addBullets(doc, section[key]);
      }
    }
  }
}

function appendGlossary(doc, kit) {
  addHeading(doc, 'Glossary');
  for (const item of kit.glossary || []) {
    doc.moveDown(0.2).font('Helvetica-Bold').fontSize(11).fillColor(COLORS.ink).text(cleanInline(item.term));
    addBody(doc, item.meaning);
    if (item.example) {
      doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(COLORS.muted).text(`Context / example: ${cleanInline(item.example)}`);
    }
  }
}

function appendFlashcards(doc, kit) {
  addHeading(doc, 'Flashcards');
  (kit.flashcards || []).forEach((card, index) => {
    doc.moveDown(0.2).font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink).text(`Card ${index + 1}${card.topic ? ` · ${cleanInline(card.topic)}` : ''}`);
    addBody(doc, `Question: ${card.question}`);
    addBody(doc, `Answer: ${card.answer}`);
    if (card.difficulty) doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLORS.muted).text(`Difficulty: ${cleanInline(card.difficulty)}`);
  });
}

function appendQuestions(doc, kit) {
  addHeading(doc, 'Exam Questions');
  (kit.exam_questions || []).forEach((item, index) => {
    const details = [item.type, item.marks ? `${item.marks} marks` : '', item.difficulty, item.topic].filter(Boolean).map(cleanInline).join(' · ');
    doc.moveDown(0.25).font('Helvetica-Bold').fontSize(10.5).fillColor(COLORS.ink).text(`Q${index + 1}. ${cleanInline(item.question)}`);
    if (details) doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLORS.muted).text(details);
    if (item.answer) {
      doc.moveDown(0.12).font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.ink).text('Answer / Explanation');
      addBody(doc, item.answer);
    }
  });
}

const APPENDERS = {
  summary: appendSummary,
  notes: appendNotes,
  glossary: appendGlossary,
  flashcards: appendFlashcards,
  questions: appendQuestions,
};

export async function createStudyPdf({ studyKit, documentName, learningMode, type }) {
  const requested = type === 'exam_questions' ? 'questions' : type;
  const isComplete = requested === 'complete';
  const selected = isComplete ? ['summary', 'notes', 'glossary', 'flashcards', 'questions'] : [requested];
  if (!selected.every((section) => section === 'complete' || APPENDERS[section])) {
    throw new Error('Unsupported PDF export type.');
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    const title = isComplete ? 'Complete Study Kit' : {
      summary: '2-Minute Summary', notes: 'Smart Notes', glossary: 'Glossary',
      flashcards: 'Flashcards', questions: 'Exam Questions',
    }[requested];
    const doc = new PDFDocument({
      size: 'LETTER', margin: 54, bufferPages: true,
      info: { Title: title, Author: 'Smart Study Companion', Subject: `Prepared from ${documentName}` },
    });
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    function drawFooter(pageNumber) {
      doc.save();
      doc.strokeColor(COLORS.line).lineWidth(0.7).moveTo(54, 718).lineTo(558, 718).stroke();
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text('Smart Study Companion', 54, 724, { lineBreak: false });
      doc.text(`Page ${pageNumber}`, 500, 724, { width: 58, align: 'right', lineBreak: false });
      doc.restore();
    }

    if (isComplete) {
      doc.moveDown(4).font('Helvetica-Bold').fontSize(24).fillColor(COLORS.ink).text('Smart Study Companion', { align: 'center' });
      doc.moveDown(1).fontSize(25).fillColor(COLORS.purple).text('Complete Study Kit', { align: 'center' });
      doc.moveDown(0.4).font('Helvetica').fontSize(13).fillColor(COLORS.muted).text(cleanInline(documentName), { align: 'center' });
      doc.moveDown(0.3).fontSize(10).text(`Generated ${new Date().toLocaleDateString('en-US', { timeZone: config.timezone })} · ${cleanInline(learningMode)} mode`, { align: 'center' });
      doc.moveDown(1.4).fontSize(11).text('Read · Understand · Organize · Recall · Practice · Revise', { align: 'center' });
      doc.addPage();
    } else {
      doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.ink).text(title);
      doc.moveDown(0.25).font('Helvetica').fontSize(10).fillColor(COLORS.muted).text(`Prepared from: ${cleanInline(documentName)}`);
      doc.text(`Generated ${new Date().toLocaleDateString('en-US', { timeZone: config.timezone })} · ${cleanInline(learningMode)} mode`);
      doc.moveDown(0.5);
    }

    for (const section of selected) {
      APPENDERS[section](doc, studyKit);
    }

    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index);
      drawFooter(index + 1);
    }
    doc.end();
  });
}
