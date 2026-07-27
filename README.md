# ScamLens

AI-powered scam detection for online marketplace buyers (OLX, Facebook Marketplace, Daraz, Instagram/WhatsApp/Telegram sellers, and similar). Paste a conversation or a listing link and get a plain-English risk report before you pay.

Two features, per the spec:

1. **Conversation Checker** — paste a full buyer/seller chat, get a risk score (0–100), detected red flags, a plain-English explanation, safety recommendations, and questions to ask the seller.
2. **URL Safety Checker** — paste a website/listing link (optionally with a product name), get a trust score across website safety, seller trust, review quality, pricing, and security.

Both are powered by Groq (`llama-3.3-70b-versatile` by default), with a small internal, **generalized** knowledge base of real reported scam patterns used as reference signals — never pattern-matched verbatim, per the product's own design rule.

---

## Project structure

```
scamlens/
├── backend/                 Node.js + Express API
│   ├── src/
│   │   ├── server.js         App entry point
│   │   ├── config/env.js     Environment config
│   │   ├── routes/           /api/conversation, /api/url
│   │   ├── controllers/      Request handling
│   │   ├── services/         Groq client, prompts, knowledge base, web search
│   │   └── middleware/       Rate limiting, validation, error handling
│   ├── tests/                node --test unit tests
│   └── .env.example
└── frontend/                 React + TypeScript + Vite + Tailwind
    ├── src/
    │   ├── pages/             Home, ConversationChecker, UrlChecker, About
    │   ├── components/        Navbar, Footer, LoadingState, ReportDisplay
    │   ├── lib/api.ts          Backend API client
    │   └── types.ts           Shared TypeScript types
    └── .env.example
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Groq API key (free at [console.groq.com](https://console.groq.com)):

```
GROQ_API_KEY=your_key_here
```

Then install and run:

```bash
npm install
npm run dev        # http://localhost:5000
```

`WEB_SEARCH_API_KEY` in `.env` is optional — it enables live web context for the URL checker via [Tavily](https://tavily.com)'s free tier. Leave it blank and the URL checker still works, just relying on the model's own knowledge instead of a fresh web lookup.

### 2. Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

`VITE_API_BASE_URL` in the frontend `.env` should point at your running backend (defaults to `http://localhost:5000`).

Open `http://localhost:5173` and you're in.

---

## API reference

### `POST /api/conversation/analyze`

```json
{ "conversation": "Seller: Hi, item is available...\nBuyer: Can I see it in person?..." }
```

Returns:

```json
{
  "error": false,
  "report": {
    "riskScore": 83,
    "riskLabel": "High Risk",
    "confidence": 91,
    "currencyDetected": "Rs",
    "redFlags": [{ "flag": "Advance payment requested", "severity": "high" }],
    "explanation": "...",
    "recommendations": ["Do NOT send an advance payment.", "..."],
    "suggestedQuestions": ["Can we meet in person?", "..."],
    "disclaimer": "This report is an advisory risk assessment..."
  }
}
```

### `POST /api/url/analyze`

```json
{ "url": "https://example.com/listing/123", "productName": "iPhone 15 Pro" }
```

Returns:

```json
{
  "error": false,
  "report": {
    "overallTrustScore": 61,
    "recommendation": "Proceed Carefully",
    "categories": {
      "websiteSafety": 70,
      "sellerTrust": 55,
      "reviewQuality": 40,
      "pricingSuspicion": "Suspicious",
      "security": 65
    },
    "findings": ["..."],
    "explanation": "...",
    "disclaimer": "This report is an advisory assessment..."
  }
}
```

Both endpoints return `{ "error": true, "message": "..." }` with a 4xx/5xx status on failure (bad input, missing API key, Groq error, etc.) — the frontend surfaces `message` directly.

---

## Notes on scope

Built per the PRD: two features only (conversation + URL checker), no image scam detection, no browser extension, no mobile app, no community reporting — those are explicitly future work, not part of this build.

Not included in this scaffold, since they need real infrastructure decisions from you: a database layer (PRD mentions SQLite/Postgres for optional opt-in storage — the current build stores nothing, statelessly, which satisfies the privacy requirement without needing a DB), and production deployment config for Vercel/Render/Railway (the code is deployment-ready, but hosting setup is environment-specific).

## Currency handling

Per your instruction, the AI is explicitly told to preserve whatever currency appears in the conversation or listing (Rs, PKR, $, etc.) rather than assuming or converting to USD — see `currencyDetected` in the conversation report.
