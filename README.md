# 📚 Smart Study Companion

> **AI-powered, source-grounded study assistant that transforms your own study material into a personalized learning kit.**

Smart Study Companion is a full-stack EdTech web application that helps students learn from their own study materials.

Users can upload a text-based PDF or paste study material, choose a learning mode, and generate an AI-powered Study Kit containing summaries, smart notes, flashcards, glossary terms, exam questions, and an AI assistant grounded in the submitted source material.

The application is designed to keep generated learning content tied to the user's provided study material instead of unnecessarily relying on external information.

---

## ✨ Features

### 📄 Study Material Input

- Upload PDF study material
- Paste study material directly
- PDF validation and text extraction
- Maximum upload size configurable up to 25 MB by default
- Detects PDFs that do not contain readable/selectable text
- OCR is not included in the current version

### 🤖 AI Study Kit

Generate a complete learning kit from the submitted material:

- 📝 Summary
- 📚 Smart Notes
- 🧠 Flashcards
- 📖 Glossary
- 🎯 Exam Questions
- 💬 Ask AI

### 🎓 Learning Modes

The application provides three learning modes:

| Mode | Purpose |
|---|---|
| Beginner | Simplifies concepts for easier understanding |
| Standard | Balanced learning and revision |
| Exam Revision | Focuses on exam-oriented preparation |

### 💬 Ask AI

The Ask AI feature allows students to ask questions about their uploaded study material.

The AI is instructed to answer using the saved source material. If the requested information cannot be found in the source, the application is designed to avoid inventing an answer.

### 🕘 Study History

Generated study sessions can be:

- Saved
- Searched
- Filtered
- Reopened
- Paginated
- Deleted

Saved chat conversations are also associated with their study sessions.

### 📥 PDF Export

Students can download:

- Summary
- Smart Notes
- Flashcards
- Glossary
- Exam Questions
- Complete Study Kit

as PDF documents.

### 🎨 User Interface

The application includes:

- Responsive UI
- Light/Dark appearance
- Sidebar navigation
- Loading states
- Empty states
- Validation messages
- API error handling
- Keyboard-accessible controls

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      Student         │
                    │   Web Browser        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React + Vite      │
                    │      Frontend       │
                    └──────────┬───────────┘
                               │
                         /api requests
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express │
                    │       Backend       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌──────────────┐  ┌──────────────┐
       │ PDF Parser │   │ Gemini AI    │  │   SQLite     │
       │ pdf-parse  │   │ @google/genai│  │  Sequelize   │
       └────────────┘   └──────────────┘  └──────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │    Study Kit         │
                    │ Summary              │
                    │ Smart Notes          │
                    │ Flashcards            │
                    │ Glossary              │
                    │ Exam Questions        │
                    │ Ask AI                │
                    └──────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- React 19
- Vite
- React Router
- Axios
- Lucide React
- Vitest
- Testing Library
- JavaScript / JSX
- CSS

## Backend

- Node.js
- Express.js
- CORS
- Multer
- dotenv
- PDF Parse
- PDFKit
- Sequelize

## AI

- Google Gemini
- `@google/genai`

The Gemini API key is kept on the backend and is never required in the React client.

## Database

- SQLite
- Sequelize ORM

---

# 📁 Project Structure

```text
smart-study-companion/
│
├── client/
│   ├── public/
│   │   └── sample_pdfs/
│   │       └── computer_networks_intro.pdf
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── AskAI.jsx
│   │   │   ├── ContentText.jsx
│   │   │   ├── DownloadButton.jsx
│   │   │   ├── ErrorBanner.jsx
│   │   │   ├── ExamQuestions.jsx
│   │   │   ├── Flashcards.jsx
│   │   │   ├── GenerateButton.jsx
│   │   │   ├── Glossary.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── HistoryList.jsx
│   │   │   ├── LearningMode.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SmartNotes.jsx
│   │   │   ├── Summary.jsx
│   │   │   └── UploadBox.jsx
│   │   │
│   │   ├── context/
│   │   │   └── StudyContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── History.jsx
│   │   │   ├── Home.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── test/
│   │   │   ├── interactions.test.jsx
│   │   │   └── setup.js
│   │   │
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
│
├── server/
│   ├── assets/
│   │   └── sample_pdfs/
│   │
│   ├── controllers/
│   │   ├── chatController.js
│   │   ├── exportController.js
│   │   ├── historyController.js
│   │   └── studyController.js
│   │
│   ├── database/
│   │   ├── database.js
│   │   ├── models.js
│   │   └── repository.js
│   │
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── uploadMiddleware.js
│   │
│   ├── prompts/
│   │   ├── chatPrompt.js
│   │   ├── index.js
│   │   ├── studyPrompt.js
│   │   └── systemPrompt.js
│   │
│   ├── routes/
│   │   ├── chatRoutes.js
│   │   ├── exportRoutes.js
│   │   ├── historyRoutes.js
│   │   └── studyRoutes.js
│   │
│   ├── services/
│   │   ├── chatService.js
│   │   ├── geminiService.js
│   │   ├── jsonParser.js
│   │   ├── pdfExportService.js
│   │   ├── pdfService.js
│   │   ├── studyGenerator.js
│   │   └── textChunker.js
│   │
│   ├── test/
│   │   ├── api.integration.test.js
│   │   ├── persistence.test.js
│   │   └── services.test.js
│   │
│   ├── uploads/
│   ├── exports/
│   ├── app.js
│   ├── config.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

---

# 🔄 Application Workflow

```text
User
  │
  ▼
Upload PDF / Paste Text
  │
  ▼
Validate Study Material
  │
  ▼
Extract Text
  │
  ▼
Select Learning Mode
  │
  ├── Beginner
  ├── Standard
  └── Exam Revision
  │
  ▼
Process / Chunk Source
  │
  ▼
Gemini AI
  │
  ▼
Generate Study Kit
  │
  ├── Summary
  ├── Smart Notes
  ├── Flashcards
  ├── Glossary
  └── Exam Questions
  │
  ▼
Save Session
  │
  ├── SQLite
  └── Chat History
  │
  ▼
Student Learning
  │
  ├── Read
  ├── Revise
  ├── Ask AI
  └── Download PDF
```

---

# 🔐 Source-Grounded AI

A major design goal of Smart Study Companion is to keep AI-generated learning content grounded in the user's submitted study material.

The backend provides the source material to the AI generation and chat services.

The Ask AI workflow uses the saved source associated with the study session.

This helps reduce answers that are unrelated to the student's material.

If the source does not contain enough information to answer a question, the system is instructed to communicate that instead of intentionally fabricating information.

> Note: AI-generated responses can still contain mistakes. Students should verify important academic information against their original material.

---

# 📄 PDF Processing

The current version supports **text-based PDFs**.

The processing flow is:

```text
PDF
 │
 ▼
File Validation
 │
 ├── Extension check
 ├── MIME check
 ├── File size check
 └── PDF signature check
 │
 ▼
Text Extraction
 │
 ▼
Text Validation
 │
 ▼
Document Processing
 │
 ▼
AI Study Kit Generation
```

### Current limitations

- Scanned/image-only PDFs are not processed.
- OCR is not included.
- PDFs must contain readable/selectable text.
- Very large documents may need to be split.

---

# 🧠 Large Document Processing

Long study materials are processed using document chunking and reduction before final generation.

Conceptually:

```text
Large Document
      │
      ▼
Text Cleaning
      │
      ▼
Chunking
      │
      ▼
Chunk Processing
      │
      ▼
Digest / Reduction
      │
      ▼
Final Study Kit Generation
```

This keeps the amount of source text passed into the generation workflow manageable.

---

# 💾 Data Storage

SQLite is used for local persistence.

The database stores information required for saved study sessions and conversations.

A typical local database path is:

```text
server/database/study_companion.db
```

The database is intentionally excluded from Git because it contains local/runtime data.

When another developer clones the project and starts the backend, Sequelize initializes the required database structure.

---

# 🔑 Environment Configuration

## Backend

Create:

```text
server/.env
```

from:

```text
server/.env.example
```

Example:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-latest
PORT=5000
DATABASE_URL=./database/study_companion.db
CLIENT_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_UPLOAD_MB=25
MAX_DOCUMENT_CHARS=2000000
APP_TIMEZONE=Asia/Kolkata
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | Gemini API key used by the backend |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini model used for generation |
| `PORT` | `5000` | Express server port |
| `DATABASE_URL` | `./database/study_companion.db` | SQLite database location |
| `CLIENT_ORIGINS` | localhost origins | Allowed browser origins |
| `MAX_UPLOAD_MB` | `25` | Maximum PDF upload size |
| `MAX_DOCUMENT_CHARS` | `2000000` | Maximum cleaned source characters |
| `APP_TIMEZONE` | `Asia/Kolkata` | Timezone used for exported PDF dates |

---

## Frontend Environment

Create:

```text
client/.env
```

Example:

```env
VITE_API_BASE_URL=/api
API_PROXY_TARGET=http://127.0.0.1:5000
```

`API_PROXY_TARGET` is used by the Vite development server to proxy `/api` requests to the Express backend.

---

# ⚠️ API Key Security

**Never commit a real Gemini API key to GitHub.**

The following files must not be committed:

```text
server/.env
client/.env
```

The repository should contain only example configuration files:

```text
server/.env.example
client/.env.example
```

Example files must contain placeholders, not real credentials.

For example:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Do not use:

```env
GEMINI_API_KEY=REAL_API_KEY
```

---

# 🚀 Installation

## Prerequisites

Install:

- Node.js 20+
- npm
- Git

Node.js 22 LTS is recommended.

Check versions:

```bash
node --version
npm --version
git --version
```

---

# 📥 Clone the Repository

```bash
git clone https://github.com/AJAISELVAMM/smart-study.git
```

Enter the project:

```bash
cd smart-study
```

---

# ⚙️ Backend Setup

Open a terminal:

```bash
cd server
```

Install dependencies:

```bash
npm ci
```

Create the environment file.

### Windows CMD

```cmd
copy .env.example .env
```

### PowerShell

```powershell
Copy-Item .env.example .env
```

Edit:

```text
server/.env
```

and add your own Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

---

# 🖥️ Frontend Setup

Open a second terminal.

From the project root:

```bash
cd client
```

Install dependencies:

```bash
npm ci
```

Create the environment file if required:

### Windows CMD

```cmd
copy .env.example .env
```

### PowerShell

```powershell
Copy-Item .env.example .env
```

Start the frontend:

```bash
npm run dev
```

Vite normally runs on:

```text
http://localhost:5173
```

Open that address in your browser.

---

# ▶️ Running the Complete Application

Two terminals are recommended.

### Terminal 1 — Backend

```bash
cd server
npm ci
npm run dev
```

### Terminal 2 — Frontend

```bash
cd client
npm ci
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 🧪 Testing

## Frontend Tests

From:

```text
client/
```

Run:

```bash
npm test
```

The frontend test suite covers important interaction behavior such as:

- Navigation
- PDF selection
- Learning mode selection
- Flashcard interactions
- Glossary search
- Download actions
- History interactions

---

## Backend Tests

From:

```text
server/
```

Run:

```bash
npm test
```

The backend tests cover areas including:

- API behavior
- PDF processing
- PDF validation
- PDF export
- JSON parsing
- Text chunking
- Study-kit normalization
- Database persistence
- Chat persistence
- No-key configuration behavior

---

# 🏗️ Production Build

Build the frontend:

```bash
cd client
npm run build
```

Preview the production build:

```bash
npm run preview
```

Start the backend:

```bash
cd server
npm start
```

---

# 🔌 API Reference

Base URL:

```text
http://localhost:5000/api
```

## Health

```http
GET /api/health
```

Checks backend status and reports whether the Gemini integration is configured.

The API does not return the actual API key.

---

## Upload PDF

```http
POST /api/study/upload
```

Content type:

```text
multipart/form-data
```

Field:

```text
file
```

Used to validate and extract text from an uploaded PDF.

---

## Generate Study Kit

```http
POST /api/study/generate
```

Can receive study text or a PDF upload together with the selected learning mode.

Example JSON:

```json
{
  "text": "Your study material...",
  "documentName": "Computer Networks",
  "learningMode": "standard"
}
```

The response contains the generated Study Kit and saved session ID.

---

## Get Study Session

```http
GET /api/study/:id
```

Retrieves a saved study session.

---

## Search History

```http
GET /api/history?q=&limit=40&offset=0
```

Used to search and paginate saved study sessions.

---

## Get History Item

```http
GET /api/history/:id
```

Retrieves a saved study session and its associated chat history.

---

## Delete History Item

```http
DELETE /api/history/:id
```

Deletes a specific study session.

---

## Delete All History

```http
DELETE /api/history
```

Clears saved study sessions and associated chat messages.

---

## Ask AI

```http
POST /api/chat
```

Example:

```json
{
  "sessionId": 1,
  "question": "Explain the main concept in simple terms."
}
```

The question is answered using the source material associated with the saved study session.

---

## Export PDF

```http
POST /api/export/pdf
```

Supported export types:

```text
summary
notes
flashcards
glossary
questions
exam_questions
complete
```

The endpoint returns a PDF document.

---

# 📦 Important Git Files

The following should be committed:

```text
client/src/
client/public/
client/package.json
client/package-lock.json

server/controllers/
server/database/*.js
server/middleware/
server/prompts/
server/routes/
server/services/
server/test/
server/app.js
server/config.js
server/package.json
server/package-lock.json

client/.env.example
server/.env.example

.gitignore
README.md
```

The following should NOT be committed:

```text
node_modules/
.env
*.db
*.sqlite
*.sqlite3
dist/
build/
uploads/
exports/
logs/
temporary/generated files
```

---

# 🔒 Privacy and Security

Smart Study Companion processes study material submitted by the user.

Important considerations:

- Keep API keys on the backend.
- Do not expose Gemini credentials in frontend code.
- Do not commit `.env` files.
- Do not commit local SQLite databases.
- Do not upload confidential study material to public repositories.
- Review third-party AI provider policies before processing sensitive documents.

Uploaded PDFs are processed for text extraction and are not intended to be stored permanently as repository files.

---

# 🧩 Current Limitations

The current version has some intentional limitations:

1. OCR is not included.
2. Scanned/image-only PDFs are not supported.
3. A valid Gemini API key is required for live AI generation.
4. AI responses may occasionally contain inaccuracies.
5. SQLite is intended for local/small-scale persistence.
6. Large documents may need to be split depending on their size and content.
7. Production deployment requires appropriate environment variables and infrastructure configuration.

---

# 🛠️ Troubleshooting

## Gemini API key error

If the application reports that Gemini is not configured:

1. Open:

```text
server/.env
```

2. Add:

```env
GEMINI_API_KEY=your_real_key
```

3. Save the file.
4. Restart the backend.

Do not put the key in:

```text
client/.env
```

and do not prefix it with `VITE_`.

---

## Frontend cannot connect to backend

Make sure the backend is running:

```bash
cd server
npm run dev
```

Verify:

```text
http://localhost:5000/api/health
```

Then check:

```env
API_PROXY_TARGET=http://127.0.0.1:5000
```

in:

```text
client/.env
```

---

## PDF cannot be processed

Make sure:

- The file is a valid PDF.
- The PDF contains selectable/readable text.
- The file is within the configured size limit.
- The PDF is not an image-only scanned document.

OCR is not included in the current version.

---

## History is empty

History is stored in:

```text
server/database/study_companion.db
```

If the database is deleted, previous local history will no longer be available.

---

# 🎯 Project Goal

Smart Study Companion aims to make studying more efficient by combining:

```text
Student Material
       ↓
AI Processing
       ↓
Personalized Learning Kit
       ↓
Understand
       ↓
Practice
       ↓
Revise
       ↓
Ask Questions
       ↓
Export & Review
```

Instead of searching through large study documents manually, students can use their own material to generate structured learning resources in one place.

---

# 📌 Project Status

**Status:** Active Development

The current version includes the core frontend, backend, AI generation workflow, PDF processing, local persistence, history management, chat functionality, PDF export, and automated tests.

---

# 👨‍💻 Repository

GitHub:

https://github.com/AJAISELVAMM/smart-study

---

## 📄 License

No open-source license has been specified for this project yet.

Until a license is added, the repository should not be assumed to grant permission to reuse, modify, or redistribute the code.
