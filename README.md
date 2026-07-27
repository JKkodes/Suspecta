# 🛡️ Suspecta

> **AI-powered scam detection platform that helps users identify fraudulent websites and suspicious online conversations before they become victims.**

---

## 🌐 Live Demo

🔗 **Live Application:***[Launch Suspecta](https://jkkodes.github.io/Suspecta/)**

---

# 📖 Overview

Suspecta is an AI-powered cybersecurity platform designed to help users make safer online decisions. It analyzes websites and marketplace conversations to identify potential scam indicators, evaluate trustworthiness, and generate easy-to-understand risk reports.

The project was inspired by a real online marketplace scam experience, where fake trust signals such as identity documents and pressure tactics were used to deceive buyers. Suspecta was built to help users recognize these warning signs before they lose money or share sensitive information.

---

# 🎯 Problem Statement

Online scams are becoming increasingly sophisticated. Many users struggle to determine whether a website, online seller, or conversation is trustworthy.

Common scams include:

- Fake online stores
- Marketplace scams
- Advance payment fraud
- Social engineering
- Phishing attempts
- Fake identities
- Artificial urgency tactics

Most users only realize they have been scammed after sending money.

Suspecta helps users detect these warning signs before making a decision.

---

# 👥 Target Users

- Online shoppers
- Marketplace buyers and sellers
- Students
- General internet users
- Small businesses
- Anyone unsure whether an online interaction is trustworthy

---

# ✨ Features

## 💬 AI Conversation Analyzer

Paste any marketplace or online conversation.

The AI analyzes:

- Advance payment requests
- Urgency tactics
- Identity manipulation
- Requests to move off-platform
- Pressure techniques
- Verification refusal
- Trust-building manipulation
- Scam probability

The report includes:

- Risk Score (0–100)
- Confidence Score
- Executive Summary
- Scam Patterns Detected
- Evidence-Based Findings
- Personalized Safety Recommendations
- Timeline of suspicious events

---

## 🌍 Website Trust Analyzer

Enter any website URL.

The analyzer evaluates:

- HTTPS security
- SSL configuration
- Business transparency
- Contact information
- Privacy Policy
- Terms of Service
- Refund policy
- Trust indicators
- Security headers
- Domain reputation
- Website credibility

The report includes:

- Trust Score
- Security Score
- Business Transparency
- Positive Trust Signals
- Potential Risk Indicators
- Evidence Summary
- Personalized Recommended Actions

---

## 📊 AI Risk Reports

Every analysis generates a structured report containing:

- Executive Summary
- Confidence Level
- Risk Breakdown
- Evidence
- Recommendations
- Final Verdict

---

## 🎨 Modern User Interface

- Responsive design
- Clean dashboard
- Dark mode interface
- Interactive score indicators
- Easy-to-read reports

---

# 🤖 AI Feature

Suspecta uses Large Language Models (LLMs) to analyze conversations and websites for scam indicators.

Instead of simply labeling something as "safe" or "unsafe", the AI explains:

- Why it reached its conclusion
- Which evidence supports the decision
- Which scam techniques were detected
- What users should do next

---

# 🧠 System Prompt

The AI was instructed with a custom prompt specifically designed for fraud detection.

### Conversation Analysis

> You are an expert cybersecurity and fraud detection assistant. Analyze marketplace and online conversations for scam indicators including advance payment requests, pressure tactics, social engineering, identity manipulation, requests to move communication off-platform, refusal to verify claims, and suspicious payment methods. Generate an evidence-based report with a risk score, confidence score, detected patterns, explanations, and personalized safety recommendations.

### Website Analysis

> You are an expert website trust evaluator. Assess websites using technical security signals, business transparency, payment safety, trust indicators, public reputation, and consumer protection best practices. Produce a balanced report with trust scores, evidence, risk indicators, and actionable recommendations. Never assume a website is fraudulent without supporting evidence.

---

# 🛠 Technologies Used

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

## AI

- OpenAI GPT
  *(Replace with Gemini or whichever model you actually used.)*

## Deployment

- Vercel

## Version Control

- Git
- GitHub

---

# 📸 Screenshots

## Home Page

*(Insert Screenshot)*

---

## Conversation Analysis

*(Insert Screenshot)*

---

## Website Analysis

*(Insert Screenshot)*

---

## AI Report

*(Insert Screenshot)*

---

# 🚀 How to Run Locally

Clone the repository

```bash
git clone https://github.com/JKkodes/Suspecta.git
```

Navigate into the project

```bash
cd Suspecta
```

Install dependencies

```bash
npm install
```

Create a `.env` file

```env
OPENAI_API_KEY=YOUR_API_KEY
```

*(Replace with the environment variables your project actually uses.)*

Start the development server

```bash
npm run dev
```

Open

```
http://localhost:5173
```

---

# 📂 Project Structure

```
Suspecta
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   ├── lib
│   └── assets
│
├── README.md
└── ...
```

---

# 💡 Future Improvements

- Browser extension
- QR code scam detection
- Email phishing analyzer
- SMS scam detection
- Image-based scam detection
- User reporting system
- Community trust database
- Multi-language support

---

# ⚠ Disclaimer

Suspecta provides AI-generated risk assessments for educational and decision-support purposes. While the system identifies many common scam indicators, it should not be considered legal or financial advice. Users should independently verify information before making important decisions.

---

# 👩‍💻 Author

**Javeria Khan**

Computer Science Student

GitHub: https://github.com/JKkodes

---

# ⭐ Why Suspecta?

Suspecta goes beyond simply assigning a trust score. It explains *why* a website or conversation may be risky, highlights supporting evidence, and provides actionable recommendations that empower users to make safer online decisions.
