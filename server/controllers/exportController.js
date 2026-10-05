import { getSessionDetail } from '../database/repository.js';
import { createStudyPdf } from '../services/pdfExportService.js';
import { HttpError } from '../utils.js';

const TYPES = new Set(['summary', 'notes', 'flashcards', 'glossary', 'questions', 'exam_questions', 'complete']);

export async function exportStudyPdf(req, res, next) {
  try {
    const sessionId = req.body?.sessionId;
    const type = String(req.body?.type || 'complete');
    if (!TYPES.has(type)) throw new HttpError(400, 'Choose a valid PDF export type.', 'INVALID_EXPORT_TYPE');
    const session = await getSessionDetail(sessionId);
    if (!session) throw new HttpError(404, 'That study session could not be found.', 'SESSION_NOT_FOUND');
    const pdf = await createStudyPdf({
      studyKit: session.studyKit,
      documentName: session.documentName,
      learningMode: session.learningMode,
      type,
    });
    const stem = session.documentName.replace(/[^a-z0-9._-]+/gi, '_').replace(/^[_\-.]+|[_\-.]+$/g, '').slice(0, 64) || 'study_material';
    const filename = `${stem}_${type}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(pdf.length));
    res.send(pdf);
  } catch (error) {
    next(error);
  }
}
