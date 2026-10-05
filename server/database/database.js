import { Sequelize } from 'sequelize';
import { config } from '../config.js';
import { defineModels } from './models.js';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.databasePath,
  logging: false,
  retry: { max: 2 },
  pool: { max: 1, min: 0, idle: 10_000 },
});

export const { StudySession, ChatMessage } = defineModels(sequelize);

export async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
}
