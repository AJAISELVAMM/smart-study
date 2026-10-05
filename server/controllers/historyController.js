import { clearSessions, deleteSession, getSessionDetail, listSessions } from '../database/repository.js';
import { HttpError } from '../utils.js';

export async function listHistory(req, res, next) {
  try {
    const result = await listSessions({
      query: String(req.query.q || ''),
      limit: req.query.limit,
      offset: req.query.offset,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getHistoryEntry(req, res, next) {
  try {
    const session = await getSessionDetail(req.params.id);
    if (!session) throw new HttpError(404, 'That study session could not be found.', 'SESSION_NOT_FOUND');
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
}

export async function removeHistoryEntry(req, res, next) {
  try {
    const removed = await deleteSession(req.params.id);
    if (!removed) throw new HttpError(404, 'That study session could not be found.', 'SESSION_NOT_FOUND');
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}

export async function removeAllHistory(req, res, next) {
  try {
    await clearSessions();
    res.json({ success: true, data: { cleared: true } });
  } catch (error) {
    next(error);
  }
}
