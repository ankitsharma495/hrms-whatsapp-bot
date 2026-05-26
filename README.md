# HRMS WhatsApp Bot

AI-powered WhatsApp HR assistant built with Node.js, TypeScript, Groq LLM, and a full RAG pipeline backed by Pinecone.

Employees can chat on WhatsApp to apply for leave, check attendance, view salary slips, and ask HR policy questions — all through natural language.

---

## Architecture Overview

```
WhatsApp (Twilio)
       │
       ▼
   Webhook (Express)
       │
       ▼
  ┌─────────────────────────────────┐
  │         AI Orchestrator         │
  │  classifier → router → agents  │
  └─────────┬───────────────────────┘
            │
   ┌────────┼────────┬──────────┬──────────┐
   ▼        ▼        ▼          ▼          ▼
 Leave   Attendance  Payroll  Policy    Analytics
 Agent    Agent      Agent    Agent      Agent
   │                           │
   ▼                           ▼
 Leave                    RAG Pipeline
 Validation               (Pinecone)
   │
   ▼
 HRMS Backend API
 (Port 3001)
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| LLM | Groq (llama-3.3-70b-versatile) |
| Embeddings | Xenova/all-MiniLM-L6-v2 (local, 384-dim) |
| Vector Store | Pinecone |
| Messaging | Twilio WhatsApp API |
| Backend | Express.js (port 3002) |
| HRMS API | Express + PostgreSQL (port 3001) |
| Session | In-memory Map (Redis-ready interface) |

---

## Project Structure

```
src/
├── app.ts                          # Express entry point (port 3002)
├── index.ts                        # Alternate entry point
│
├── ai/
│   ├── orchestrator/
│   │   ├── classifier.ts           # Intent classification via Groq
│   │   ├── executor.ts             # Main message handler (entry point for all messages)
│   │   ├── router.agent.ts         # Maps intents → agent handlers
│   │   └── response.generator.ts   # Generic LLM response generation
│   │
│   ├── agents/
│   │   ├── leave.agent.ts          # Leave apply/balance/history + AI extraction + validation
│   │   ├── attendance.agent.ts     # Attendance summary & recent logs
│   │   ├── payroll.agent.ts        # Salary slip & payroll history
│   │   ├── policy.agent.ts         # RAG-powered policy Q&A
│   │   └── analytics.agent.ts      # HR analytics queries
│   │
│   ├── tools/
│   │   ├── applyLeave.tool.ts      # Apply leave via HRMS API
│   │   ├── getLeaveBalance.tool.ts # Fetch leave balances
│   │   ├── getAttendance.tool.ts   # Fetch attendance data
│   │   ├── getPayroll.tool.ts      # Fetch payroll/salary slips
│   │   ├── searchPolicy.tool.ts    # Semantic search on policy docs
│   │   ├── notifyManager.tool.ts   # Manager notification
│   │   └── analytics.tool.ts       # Analytics queries
│   │
│   ├── prompts/
│   │   ├── classifier.prompt.ts    # Intent classification system prompt
│   │   ├── leave.prompt.ts         # Leave extraction prompt (JSON output)
│   │   ├── policy.prompt.ts        # RAG policy Q&A prompt (context-only answering)
│   │   ├── payroll.prompt.ts       # Payroll prompt
│   │   └── analytics.prompt.ts     # Analytics prompt
│   │
│   ├── rag/
│   │   ├── document.loader.ts      # PDF/TXT/MD loader (LangChain PDFLoader)
│   │   ├── chunking.ts             # RecursiveCharacterTextSplitter (1000/200)
│   │   ├── embeddings.ts           # Local embeddings (Xenova/all-MiniLM-L6-v2)
│   │   ├── vector.store.ts         # Pinecone upsert + semantic search
│   │   ├── retriever.ts            # High-level retrieval interface
│   │   └── policy.search.ts        # Policy-specific search + context builder
│   │
│   ├── memory/
│   │   └── redis.memory.ts         # In-memory session store (Redis-ready)
│   │
│   └── services/
│       └── leave-validation.service.ts  # Balance check + alternative suggestion
│
├── integrations/
│   └── whatsapp/
│       ├── webhook.ts              # Twilio webhook route
│       ├── whatsapp.service.ts     # Message sender (Twilio API)
│       ├── formatter.ts            # Message formatting
│       └── templates.ts            # Response templates
│
├── services/
│   ├── hrms-api.service.ts         # HRMS backend API client
│   └── openai.service.ts           # Groq API client (LLM completions)
│
├── shared/
│   ├── utils/
│   │   ├── date.ts                 # Natural language date normalization
│   │   └── format.ts               # Formatting helpers
│   ├── constants/
│   │   └── app.ts                  # App constants
│   └── types/
│       └── index.ts                # Shared type definitions
│
└── scripts/
    └── ingest.ts                   # RAG ingestion runner
```

---

## RAG Pipeline

### Ingestion Flow

```
docs/*.pdf
    │
    ▼
┌──────────────────┐
│ Document Loader  │  PDFLoader (LangChain) + TXT/MD reader
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Chunking      │  RecursiveCharacterTextSplitter
│  size=1000       │  overlap=200
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Embeddings     │  Xenova/all-MiniLM-L6-v2
│   dim=384        │  Runs 100% locally (no API key)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Pinecone      │  Upsert with content + source metadata
│  metric=cosine   │  Batches of 100 vectors
└──────────────────┘
```

### Query Flow

```
User: "Can I carry forward casual leaves?"
    │
    ▼
┌──────────────────┐
│ Generate Query   │  Embed user question (384-dim)
│   Embedding      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Pinecone Query   │  topK=3, includeMetadata=true
│                  │  Returns chunks + similarity scores
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Context Builder  │  Formats chunks with source attribution
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Groq LLM       │  System prompt + context + user question
│   (RAG Prompt)   │  "Answer ONLY from provided context"
└────────┬─────────┘
         │
         ▼
"Unused casual leaves expire at the end of
 the financial year and cannot be carried forward."
```

### Run Ingestion

```bash
# Place HR policy PDFs in docs/
npm run ingest
```

---

## AI Message Flow

```
1. User sends WhatsApp message
2. Webhook receives message
3. Executor identifies employee (phone → HRMS API)
4. If multi-turn flow active → continue (e.g. collecting missing leave fields)
5. Classifier determines intent via Groq:
   - leave_balance, leave_apply, leave_history
   - attendance_summary, attendance_recent
   - payroll_slip, payroll_recent
   - policy_query
   - greeting, unknown
6. Router maps intent → agent handler
7. Agent processes request:
   - Leave: AI extraction → balance validation → apply or suggest alternatives
   - Policy: semantic search → RAG prompt → LLM answer
   - Others: direct HRMS API calls
8. Response sent back via Twilio WhatsApp
```

---

## Leave Apply Flow (AI-Powered)

```
User: "I need sick leave tomorrow because I am sick"
    │
    ▼
┌────────────────────┐
│  AI Extraction     │  Groq extracts: type, dates, duration, reason
│  (One-Shot)        │  from natural language in a single LLM call
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Date Normalization │  "tomorrow" → "2026-05-27"
│                    │  "next monday" → YYYY-MM-DD
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Balance Validation │  Fetch balance from HRMS API
│                    │  Check if sufficient days remain
└────────┬───────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Sufficient  Insufficient
    │         │
    ▼         ▼
 Apply     "Sick leave: 0 remaining
 Leave      Casual: 2, Earned: 5
            Use another type?"
                │
                ▼
            User: "Use casual"
                │
                ▼
            Re-validate → Apply
```

---

## Setup

### Prerequisites

- Node.js 18+
- HRMS Backend running on port 3001
- Twilio account with WhatsApp sandbox
- Groq API key
- Pinecone account + index (384 dimensions, cosine metric)

### Installation

```bash
cd whatsapp-bot
npm install
```

### Environment Variables

Create `.env`:

```env
PORT=3002
GROQ_API_KEY=your_groq_api_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
HRMS_API_URL=http://localhost:3001
HRMS_API_KEY=your_api_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=hrms-docs
```

### Run

```bash
# Start the bot
npm run dev

# Ingest policy documents
npm run ingest

# Build for production
npm run build
npm start
```

---

## Embedding Provider

The embedding system uses a **provider pattern** — swap implementations without touching application code:

| Provider | Model | Dimensions | API Key |
|---|---|---|---|
| **Local (default)** | Xenova/all-MiniLM-L6-v2 | 384 | Not needed |
| OpenAI (future) | text-embedding-3-small | 1536 | Required |
| Cohere (future) | embed-english-v3.0 | 1024 | Required |

```typescript
// Switch provider globally:
import { setEmbeddingProvider } from './ai/rag/embeddings';
setEmbeddingProvider(myOpenAIProvider);
```

---

## Supported Intents

| Intent | Agent | Description |
|---|---|---|
| `leave_balance` | Leave | Check remaining leave days |
| `leave_apply` | Leave | Apply for leave (AI extraction) |
| `leave_history` | Leave | View recent leave applications |
| `attendance_summary` | Attendance | Monthly attendance summary |
| `attendance_recent` | Attendance | Recent attendance logs |
| `payroll_slip` | Payroll | Download salary slip |
| `payroll_recent` | Payroll | Recent payroll history |
| `policy_query` | Policy | RAG-powered policy Q&A |
| `analytics_query` | Analytics | HR analytics queries |
| `greeting` | - | Welcome message |
| `unknown` | - | Help/fallback message |
