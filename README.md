# 🕵️ ShadowRecruit — AI-Powered Mock Interview Chatbot

> A production-grade AI agent that conducts async, multi-turn mock interviews via Slack — powered by LangChain, RAG, and LLMs.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-black?style=flat&logo=vercel)](https://shadow-recruit.vercel.app)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat&logo=langchain&logoColor=white)](https://langchain.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 📸 Demo

> 🔗 **[shadow-recruit-web.vercel.app](https://shadow-recruit.vercel.app)**

---

## ✨ Features

- 🤖 **AI agent-based interviews** — async multi-turn LLM-powered conversations via Slack
- 🧠 **RAG pipeline** — chunked corpora, sentence-transformer embeddings, vector store indexing
- ⚡ **95% query relevance** validated through systematic A/B testing on 500+ queries
- 🚀 **30% faster LLM response** — restructured prompts + async FastAPI migration
- 📊 **Full-stack** — TypeScript/React frontend deployed on Vercel, Python backend on Render
- 🔧 **Slack-native** — built with Slack Bolt SDK for seamless developer workflow integration

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| AI / LLM | LangChain, RAG, sentence-transformers, LLMs |
| Backend | Python, FastAPI (async), Slack Bolt SDK |
| Frontend | TypeScript, React, CSS |
| Infrastructure | Vercel (frontend), Render (backend) |
| DevOps | Docker, Git, GitHub |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│   Slack Client  │────▶│  FastAPI Backend      │────▶│  Vector Store     │
│  (Bolt SDK)     │     │  (Async endpoints)    │     │  (RAG Pipeline)   │
└─────────────────┘     └──────────────────────┘     └───────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   LLM (via LangChain) │
                        │   Multi-turn memory   │
                        └──────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  React Frontend       │
                        │  (Vercel deployment)  │
                        └──────────────────────┘
```

---

## 📁 Project Structure

```
shadow-recruit/
├── frontend/               # TypeScript + React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── package.json
├── backend/                # Python FastAPI + LangChain
│   ├── app/
│   │   ├── agents/         # LLM agent logic
│   │   ├── rag/            # RAG pipeline (embed, index, retrieve)
│   │   ├── slack/          # Slack Bolt SDK integration
│   │   └── main.py
│   └── requirements.txt
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.9
- A Slack App with Bot Token and Signing Secret
- An LLM API key (OpenAI / compatible)

### Installation

```bash
# Clone the repo
git clone https://github.com/bhumikadangayach/shadow-recruit.git
cd shadow-recruit
```

#### Backend

```bash
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Fill in: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, OPENAI_API_KEY

uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000` · Backend: `http://localhost:8000`

---

## 🔬 Key Technical Decisions

### RAG Pipeline Design
- Documents are **chunked** and embedded using `sentence-transformers`
- Embeddings indexed into a **vector store** for fast semantic retrieval
- Achieved **95% relevance** on 500+ interview queries (validated via A/B testing)

### Latency Optimization
- Profiled inference path → identified **prompt bloat** as the primary latency driver
- Restructured prompts and migrated to **async FastAPI** → 30% reduction in LLM response time

### Slack Integration
- Built using **Slack Bolt SDK** for event-driven, async message handling
- Supports multi-turn conversation state across sessions

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: add X feature"`
4. Push and open a Pull Request

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 👩‍💻 Author

**Bhumika Dangayach** — BIT Mesra '27  
[![GitHub](https://img.shields.io/badge/GitHub-bhumikadangayach-181717?style=flat&logo=github)](https://github.com/bhumikadangayach)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/bhumika-dangayach-9a9a87284/)

---

<div align="center">
  If this project helped you, please give it a ⭐ — it helps others find it!
</div>
