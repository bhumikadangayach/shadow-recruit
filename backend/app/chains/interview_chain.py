"""
Interview Chain
───────────────
Drives the conversational interview using:
- ConversationBufferMemory for full turn history
- RAG context from resume + JD
- Switchable LLM (OpenAI / Anthropic)
- Structured prompt templates per interview type
"""
from typing import Literal

from langchain_classic.chains import ConversationChain
from langchain_classic.memory import ConversationBufferMemory
from langchain_core.messages import SystemMessage
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
)

from app.core.llm_factory import get_llm
from app.rag.ingestion import retrieve_jd_context, retrieve_resume_context

# ─── System Prompts ───────────────────────────────────────────────────────────

SYSTEM_PROMPTS = {
    "general": """You are an expert technical recruiter conducting a professional mock job interview.
Your goal is to help the candidate practice and improve their interview skills.

Candidate Resume Context:
{resume_context}

Job Description Context:
{jd_context}

Interview Guidelines:
- Start with a warm welcome and one opening question
- Ask ONE question at a time — never multiple questions in a single turn
- Listen carefully to answers and ask intelligent follow-up questions
- Probe for depth: ask for specific examples, metrics, or outcomes
- Use the STAR method (Situation, Task, Action, Result) for behavioral questions
- Cover: experience, skills, motivation, cultural fit, problem-solving
- After ~8-10 exchanges, wrap up naturally and thank the candidate
- Maintain a professional, encouraging tone throughout

Begin the interview now with a warm welcome and your first question.""",

    "technical": """You are a senior software engineer conducting a technical mock interview.
Your goal is to rigorously assess the candidate's technical depth and problem-solving ability.

Candidate Resume Context:
{resume_context}

Job Description Context:
{jd_context}

Interview Guidelines:
- Ask ONE technical question at a time
- Start with fundamentals, then increase complexity based on answers
- For coding questions, ask the candidate to explain their approach before the solution
- Probe: time complexity, edge cases, alternative approaches, trade-offs
- Cover: data structures, algorithms, system design, language-specific knowledge
- Ask follow-ups like "How would you scale this?" or "What are the trade-offs?"
- After ~10 exchanges, close with a system design or architecture question

Begin with a brief intro and your first technical question.""",

    "behavioral": """You are an experienced HR manager conducting a behavioral mock interview.
Your goal is to assess the candidate's soft skills, leadership, and culture fit.

Candidate Resume Context:
{resume_context}

Job Description Context:
{jd_context}

Interview Guidelines:
- Use the STAR method for every behavioral question
- Ask ONE question at a time, always grounded in real past experiences
- Core areas: leadership, conflict resolution, teamwork, failure/growth, communication
- Probe when answers are vague: "Can you be more specific about your role?"
- Look for ownership, self-awareness, and growth mindset
- Sample openers: "Tell me about a time when...", "Describe a situation where..."
- After 8-10 exchanges, close gracefully

Begin with a warm introduction and your first behavioral question.""",
}


# ─── Interview Chain Builder ──────────────────────────────────────────────────

class InterviewChain:
    def __init__(
        self,
        session_id: str,
        user_id: str,
        interview_type: Literal["general", "technical", "behavioral"] = "general",
        llm_provider: Literal["openai", "anthropic"] = "openai",
        jd_id: str | None = None,
        history: list[dict] | None = None,
    ):
        self.session_id = session_id
        self.user_id = user_id
        self.interview_type = interview_type
        self.llm_provider = llm_provider
        self.jd_id = jd_id

        self.llm = get_llm(provider=llm_provider, temperature=0.7, streaming=True)
        self.memory = ConversationBufferMemory(return_messages=True, memory_key="history")

        # Restore prior history if resuming a session
        if history:
            for msg in history:
                if msg["role"] == "user":
                    self.memory.chat_memory.add_user_message(msg["content"])
                elif msg["role"] == "assistant":
                    self.memory.chat_memory.add_ai_message(msg["content"])

    def _build_context(self, user_message: str) -> tuple[str, str]:
        """Retrieve RAG context for resume and job description."""
        resume_docs = retrieve_resume_context(self.user_id, user_message, k=3)
        resume_context = "\n\n".join(d.page_content for d in resume_docs) if resume_docs else "No resume uploaded."

        jd_context = "No job description provided."
        if self.jd_id:
            jd_docs = retrieve_jd_context(self.jd_id, user_message, k=3)
            if jd_docs:
                jd_context = "\n\n".join(d.page_content for d in jd_docs)

        return resume_context, jd_context

    def _build_chain(self, resume_context: str, jd_context: str) -> ConversationChain:
        system_prompt = SYSTEM_PROMPTS[self.interview_type].format(
            resume_context=resume_context,
            jd_context=jd_context,
        )
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_prompt),
            MessagesPlaceholder(variable_name="history"),
            HumanMessagePromptTemplate.from_template("{input}"),
        ])
        return ConversationChain(
            llm=self.llm,
            memory=self.memory,
            prompt=prompt,
            verbose=False,
        )

    async def chat(self, user_message: str) -> str:
        """Send a user message and get the AI interviewer's response."""
        resume_context, jd_context = self._build_context(user_message)
        chain = self._build_chain(resume_context, jd_context)
        response = await chain.ainvoke({"input": user_message})
        return response["response"]

    def get_history(self) -> list[dict]:
        """Return full conversation history as serializable list."""
        messages = []
        for msg in self.memory.chat_memory.messages:
            role = "user" if msg.type == "human" else "assistant"
            messages.append({"role": role, "content": msg.content})
        return messages
