import { answerStudyQuestion } from '../services/chatService.js';

export async function askStudyQuestion(req, res, next) {
  try {
    const result = await answerStudyQuestion({
      sessionId: req.body?.sessionId,
      question: req.body?.question,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
