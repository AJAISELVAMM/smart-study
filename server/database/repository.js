import { Op } from 'sequelize';
import { ChatMessage, sequelize, StudySession } from './database.js';

function parseGeneratedData(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeSession(row, { includeChat = false } = {}) {
  if (!row) return null;
  const value = row.toJSON ? row.toJSON() : row;
  const session = {
    id: value.id,
    documentName: value.documentName,
    sourceType: value.sourceType,
    learningMode: value.learningMode,
    studyKit: parseGeneratedData(value.generatedData),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
  if (includeChat) {
    session.chatMessages = (value.chatMessages || []).map((message) => ({
      id: message.id,
      role: message.role,
      message: message.message,
      createdAt: message.createdAt,
    }));
  }
  return session;
}

export async function createSession({ documentName, sourceType, learningMode, sourceText, studyKit }) {
  const row = await StudySession.create({
    documentName,
    sourceType,
    learningMode,
    sourceText,
    generatedData: JSON.stringify(studyKit),
  });
  return serializeSession(row);
}

export async function listSessions({ query = '', limit = 50, offset = 0 } = {}) {
  const normalizedQuery = String(query || '').trim().slice(0, 120);
  const where = normalizedQuery
    ? { [Op.or]: [
      { documentName: { [Op.like]: `%${normalizedQuery}%` } },
      { learningMode: { [Op.like]: `%${normalizedQuery}%` } },
    ] }
    : {};
  const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const startAt = Math.min(Math.max(Number(offset) || 0, 0), 1_000_000);
  const rows = await StudySession.findAll({
    where,
    attributes: ['id', 'documentName', 'sourceType', 'learningMode', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit: pageSize + 1,
    offset: startAt,
  });
  const hasMore = rows.length > pageSize;
  const sessions = rows.slice(0, pageSize).map((row) => {
    const value = row.toJSON();
    return {
      id: value.id,
      documentName: value.documentName,
      sourceType: value.sourceType,
      learningMode: value.learningMode,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  });
  return { sessions, hasMore, nextOffset: hasMore ? startAt + pageSize : null };
}

export async function getSessionDetail(id) {
  const row = await StudySession.findByPk(id);
  if (!row) return null;
  const messages = await ChatMessage.findAll({
    where: { sessionId: row.id },
    order: [['createdAt', 'ASC'], ['id', 'ASC']],
  });
  const serialized = serializeSession(row, { includeChat: true });
  serialized.chatMessages = messages.map((message) => ({
    id: message.id,
    role: message.role,
    message: message.message,
    createdAt: message.createdAt,
  }));
  return serialized;
}

export async function getSessionForChat(id) {
  const row = await StudySession.findByPk(id);
  if (!row) return null;
  const messages = await ChatMessage.findAll({
    where: { sessionId: row.id },
    order: [['createdAt', 'ASC'], ['id', 'ASC']],
  });
  return {
    session: serializeSession(row),
    sourceText: row.sourceText,
    messages: messages.map((message) => ({ role: message.role, content: message.message })),
  };
}

export async function saveChatTurn(sessionId, question, answer) {
  return sequelize.transaction(async (transaction) => {
    await ChatMessage.bulkCreate([
      { sessionId, role: 'user', message: question },
      { sessionId, role: 'assistant', message: answer },
    ], { transaction });
    await StudySession.update({ updatedAt: new Date() }, { where: { id: sessionId }, transaction });
    const rows = await ChatMessage.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC'], ['id', 'ASC']],
      transaction,
    });
    return rows.map((message) => ({
      id: message.id,
      role: message.role,
      message: message.message,
      createdAt: message.createdAt,
    }));
  });
}

export async function deleteSession(id) {
  return sequelize.transaction(async (transaction) => {
    const sessionId = Number(id);
    await ChatMessage.destroy({ where: { sessionId }, transaction });
    return StudySession.destroy({ where: { id: sessionId }, transaction });
  });
}

export async function clearSessions() {
  return sequelize.transaction(async (transaction) => {
    await ChatMessage.destroy({ where: {}, transaction });
    await StudySession.destroy({ where: {}, transaction });
  });
}
