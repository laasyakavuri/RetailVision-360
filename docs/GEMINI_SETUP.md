# RetailVision 360 — Gemini AI Copilot Configuration Guide

This guide details the integration, security architecture, and operational configuration of the Gemini AI Copilot within **RetailVision 360**.

---

## 1. Obtaining a Gemini API Key

1. Navigate to [Google AI Studio API Keys](https://aistudio.google.com/api-keys).
2. Sign in with your Google account.
3. Click **Create API Key** and select your Google Cloud project (or generate a default key).
4. Copy the secret API key.

> **IMPORTANT**: Never commit API keys to version control, embed them in client-side JavaScript, or share them in public repositories.

---

## 2. Server-Side Configuration

RetailVision 360 enforces strict server-side encapsulation. The frontend **never** touches or accesses your Gemini API key.

Open or create `backend/.env` (using `backend/.env.example` as a template):

```ini
# Gemini AI Configuration
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# System Configuration
DEVICE=cpu
MODEL_CONFIDENCE_THRESHOLD=0.35
DATABASE_URL=sqlite:///./retailvision360.db
```

### Supported Models
The backend is built against Google's modern **`google-genai`** SDK. Supported models include:
- `gemini-2.5-flash` (Recommended: fast, cost-efficient, low latency)
- `gemini-1.5-flash` (Stable enterprise generalist)
- `gemini-1.5-pro` (Complex multi-step reasoning)

---

## 3. Verifying the Integration

1. Start or restart the FastAPI backend:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```
2. Check the endpoint status in your browser or terminal:
   ```bash
   curl http://localhost:8000/api/chat/status
   ```
3. Expected JSON response:
   ```json
   {
     "status": "ready",
     "model": "gemini-2.5-flash",
     "grounding_active": true
   }
   ```
   If the API key is not configured, the endpoint returns:
   ```json
   {
     "status": "unconfigured",
     "model": "gemini-2.5-flash",
     "grounding_active": false
   }
   ```
   *(Note: The rest of the application remains fully functional even if Gemini is unconfigured.)*

---

## 4. How Database-Grounded Retrieval Works

Unlike generic chatbots that hallucinate store inventory, RetailVision AI is strictly grounded in the SQLite database through `retail_context_service.py`:

```
User Query: "Why is task T-001 prioritized over T-002?"
               │
               ▼
FastAPI Backend /api/chat/conversations/{id}/messages
               │
               ▼
RetailContextService.build_executive_summary()
   ├── Queries active ShelfAudits & OpenTasks
   ├── Extracts task score breakdowns & backroom inventory
   └── Formats a bounded Markdown snapshot (~1,200 tokens)
               │
               ▼
google-genai Client.models.generate_content()
   ├── System Instructions (Guardrails against hallucination & SQL execution)
   ├── Database Context Snapshot
   └── User Prompt
               │
               ▼
Structured Response returned to React Frontend
```

---

## 5. Security & Privacy Safeguards

- **Zero Client-Side Leakage**: The frontend contains zero references to `GEMINI_API_KEY` or `VITE_GEMINI_KEY`.
- **No Arbitrary SQL Execution**: The model is provided structured, read-only summaries; it cannot execute raw SQL statements against SQLite.
- **Bounded Context**: Context size is capped to prevent latency spikes and unexpected token consumption.
- **Privacy-Preserving**: No customer facial data, credit card numbers, or video streams are transmitted to third-party endpoints.
