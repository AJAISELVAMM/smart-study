import path from 'node:path';
import { getSessionDetail, createSession } from '../database/repository.js';
import { extractPdfText, cleanText } from '../services/pdfService.js';
import { generateStudyKit } from '../services/studyGenerator.js';
import { HttpError } from '../utils.js';

const VALID_MODES = new Set(['Beginner', 'Standard', 'Exam Revision']);

export async function uploadStudyPdf(req, res, next) {
  try {
    if (!req.file) throw new HttpError(400, 'Choose a PDF file before continuing.', 'MISSING_FILE');
    const extracted = await extractPdfText(req.file);
    res.json({
      success: true,
      data: {
        documentName: extracted.documentName,
        sourceType: 'pdf',
        pageCount: extracted.pageCount,
        text: extracted.text,
        characterCount: extracted.text.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function generateStudy(req, res, next) {
  try {
    const body = req.body || {};
    let sourceText = '';
    let documentName = String(body.documentName || '').trim();
    let sourceType = body.sourceType === 'pdf' ? 'pdf' : 'text';

    if (req.file) {
      const extracted = await extractPdfText(req.file);
      sourceText = extracted.text;
      documentName = extracted.documentName;
      sourceType = 'pdf';
    } else {
      sourceText = cleanText(body.text || '');
      if (!documentName) documentName = 'Pasted study material';
      documentName = path.basename(documentName).slice(0, 240);
    }

    const learningMode = VALID_MODES.has(body.learningMode) ? body.learningMode : 'Standard';
    const studyKit = await generateStudyKit({ text: sourceText, documentName, learningMode });
    const session = await createSession({
      documentName: documentName || 'Study material',
      sourceType,
      learningMode,
      sourceText,
      studyKit,
    });
    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        documentName: session.documentName,
        sourceType: session.sourceType,
        learningMode: session.learningMode,
        studyKit: session.studyKit,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudy(req, res, next) {
  try {
    const session = await getSessionDetail(req.params.id);
    if (!session) throw new HttpError(404, 'That study session could not be found.', 'SESSION_NOT_FOUND');
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
}
