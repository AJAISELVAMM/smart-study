# Smart Study Companion

A complete JavaScript EdTech app that turns your own study material into a personalized, source-grounded learning kit. The client is React + Vite; the API is Node.js + Express; Gemini calls and the API key stay on the server; saved sessions and chat use SQLite through Sequelize.

## What it does

- Accepts text-based PDFs (up to **25 MB**) or pasted study material. Scanned/image-only PDFs are detected and rejected with a clear message; OCR is not included.
- Offers three learning modes: **Beginner**, **Standard**, and **Exam Revision**.
- Generates a Study Kit with six sections inside Home:
  - Summary
  - Smart Notes
  - Flashcards
  - Glossary
  - Exam Questions
  - Ask AI, grounded in the saved source material
- Saves sessions and chat messages in SQLite. History is searchable, filterable, reopenable, paginated, and deletable.
- Creates a PDF for any section or for the complete kit.
- Includes a working sample PDF: `client/public/sample_pdfs/computer_networks_intro.pdf`.
- Provides responsive layouts, keyboard-accessible controls, light/dark appearance, and useful loading, empty, validation, and API error states.

Generated material and direct Ask AI answers are instructed to rely only on the submitted study source. If the source does not contain an answer, Ask AI is instructed to say so instead of filling gaps with outside information. Long source documents are chunked and reduced before generation to keep context bounded.

## Requirements

- Node.js **20.20+** (Node 22 LTS is also suitable) and npm.
- A Gemini API key for live generation and Ask AI. The key is optional for installing, building, running the UI, using History, testing PDF parsing/export, and running the test suite.

## Install and run

The ZIP intentionally does **not** include `node_modules`, a local database, or environment files. Copy the example server environment file before starting the backend.

### 1. Configure the backend

```bash
cd smart-study-companion/server
cp .env.example .env
```

Edit `server/.env` and set:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
```

The default model is `gemini-3.8-flash`. You may change `GEMINI_MODEL` in `server/.env` if needed. Do not put the key in `client/.env`, React code, or a public Vite variable.

Install and start the API:

```bash
npm ci
npm run dev
```

The Express API listens on `http://localhost:5000`. On first startup, Sequelize creates the SQLite tables automatically.

### 2. Start the React client in a second terminal

```bash
cd smart-study-companion/client
cp .env.example .env
npm ci
npm run dev
```

Open the Vite address shown in the terminal (normally `http://localhost:5173`). The browser calls relative `/api` URLs; Vite proxies those requests to Express. `API_PROXY_TARGET` in `client/.env` can be changed if the backend is running elsewhere.

### 3. Try the sample

In Home, choose **PDF upload**, select the included `computer_networks_intro.pdf`, choose a learning mode, then generate the kit. Or use **Paste text** and provide at least 80 readable characters.

Without `GEMINI_API_KEY`, the application reports the missing configuration and does not return placeholder or fabricated AI content. Add a valid key and restart the API to use generation and Ask AI.

## Build and tests

Run each client command from `client/` and each server command from `server/`:

```bash
# Client
npm run build
npm test

# Server
npm test
npm audit
```

The tests cover React control behavior (navigation, PDF selection validation, learning-mode selection, flashcard reveal/advance, glossary search, downloads, History reopen/delete), API responses, PDF extraction/validation, PDF exports, JSON parsing, source chunking, structured kit normalization, history/chat persistence across a closed and reopened Node process, and safe no-key behavior.

**Live Gemini requests were not exercised in this environment because no API key was supplied.** The tests verify that requests fail explicitly with `AI_NOT_CONFIGURED` rather than manufacturing a response.

## Configuration

`server/.env.example` documents the backend settings:

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | blank | Server-side Gemini API key |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Gemini model name |
| `PORT` | `5000` | Express API port |
| `DATABASE_URL` | `./database/study_companion.db` | SQLite file path; absolute paths are accepted, and `:memory:` is useful for tests |
| `CLIENT_ORIGINS` | localhost Vite origins | Allowed browser origins in production |
| `MAX_UPLOAD_MB` | `25` | Maximum PDF upload size |
| `MAX_DOCUMENT_CHARS` | `2000000` | Maximum cleaned source length |
| `APP_TIMEZONE` | `Asia/Kolkata` | Time zone used in exported PDF dates |

The client `.env.example` sets `VITE_API_BASE_URL=/api` and `API_PROXY_TARGET=http://127.0.0.1:5000`. The proxy target is used by the Vite server, not browser code.

## Data and privacy

- SQLite is stored by default at `server/database/study_companion.db`; `server/database/` is created if missing. Do not delete this file if you want to keep History.
- Each saved session includes the submitted text, generated kit, source type, learning mode, timestamps, and saved chat turns. The history list endpoint omits the original source text; a reopened session returns its generated kit and chat.
- Source text is sent from the backend to Gemini when generating a kit or answering a question. Do not upload material you are not permitted to process with the configured provider.
- Uploaded files are held in memory for extraction and are not written to an upload directory. Only PDF is accepted; extension, MIME type, file size, and PDF signature are checked.
- `.env`, SQLite files, uploads, exports, build output, and `node_modules` are ignored by `.gitignore`.

## API reference

All JSON endpoints use `{ "success": true, "data": ... }` on success. Errors use `{ "success": false, "error": "...", "code": "..." }` with an appropriate HTTP status. PDF exports return `application/pdf` as an attachment.

| Method and path | Input | Purpose |
|---|---|---|
| `GET /api/health` | — | API status and whether a server-side Gemini key is configured (never returns the key) |
| `POST /api/study/upload` | `multipart/form-data`, field `file` | Validate and extract text from a PDF; returns extracted text, page count, and filename |
| `POST /api/study/generate` | JSON `{ text, documentName?, learningMode? }` **or** multipart fields `file`, `learningMode` | Generate a Study Kit and persist a session; returns its ID and kit |
| `GET /api/study/:id` | — | Reopen a session, including its chat messages |
| `GET /api/history?q=&limit=40&offset=0` | — | Search and page through saved sessions; returns `sessions`, `hasMore`, and `nextOffset` |
| `GET /api/history/:id` | — | Fetch a saved session and chat history |
| `DELETE /api/history/:id` | — | Delete one session and its chat messages |
| `DELETE /api/history` | — | Clear all sessions and chat messages |
| `POST /api/chat` | JSON `{ sessionId, question }` | Answer using the saved source and persist the turn only after a successful answer |
| `POST /api/export/pdf` | JSON `{ sessionId, type }` | Download one section or the complete kit |

Supported PDF `type` values are `summary`, `notes`, `flashcards`, `glossary`, `questions` (or `exam_questions`), and `complete`.

## Project layout

```text
smart-study-companion/
├── client/
│   ├── public/sample_pdfs/       # Included demo PDF
│   └── src/                      # React pages, components, context, API, and tests
└── server/
    ├── controllers/              # Request handlers
    ├── database/                 # Sequelize models, SQLite setup, repository
    ├── middleware/               # PDF upload and API error handling
    ├── prompts/                  # Grounded Gemini system/task prompts and schemas
    ├── routes/                   # Express API routes
    ├── services/                 # Gemini, PDF parsing/export, chat, chunking, JSON validation
    └── test/                     # API, persistence, parser, and chunking tests
```

## Troubleshooting

- **“Gemini API key is not configured”**: put the key in `server/.env`, then restart `npm run dev` in the server folder. Never prefix it with `VITE_`.
- **The Vite page loads but the API is unavailable**: ensure the server is listening on port 5000 and check `API_PROXY_TARGET` in `client/.env`.
- **PDF has no selectable text**: use a text-based PDF or paste its text. OCR is not part of this version.
- **PDF is too large / document is too long**: split it into smaller parts. Defaults are 25 MB and 2,000,000 cleaned characters.
- **Gemini quota/authentication errors**: check the configured key, model access, and account quota; user-facing responses are intentionally generic and the server log contains diagnostic status without printing the key.
