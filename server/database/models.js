export function defineModels(sequelize) {
  const { DataTypes } = sequelize.constructor;

  const StudySession = sequelize.define('StudySession', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    documentName: { type: DataTypes.STRING(240), allowNull: false, field: 'document_name' },
    sourceType: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'text', field: 'source_type' },
    learningMode: { type: DataTypes.STRING(30), allowNull: false, field: 'learning_mode' },
    sourceText: { type: DataTypes.TEXT, allowNull: false, field: 'source_text' },
    generatedData: { type: DataTypes.TEXT, allowNull: false, field: 'generated_data' },
  }, {
    tableName: 'study_sessions',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['created_at'] }, { fields: ['document_name'] }],
  });

  const ChatMessage = sequelize.define('ChatMessage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'session_id',
      references: { model: 'study_sessions', key: 'id' },
    },
    role: { type: DataTypes.STRING(20), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [{ fields: ['session_id', 'created_at'] }],
  });

  StudySession.hasMany(ChatMessage, {
    as: 'chatMessages',
    foreignKey: 'sessionId',
    onDelete: 'CASCADE',
    hooks: true,
  });
  ChatMessage.belongsTo(StudySession, { as: 'session', foreignKey: 'sessionId' });

  return { StudySession, ChatMessage };
}
