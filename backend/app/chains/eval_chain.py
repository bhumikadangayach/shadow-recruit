"""
Evaluation Chain
────────────────
After an interview session ends, this chain:
1. Reviews the full conversation transcript
2. Scores each answer on multiple dimensions
3. Returns structured JSON feedback for the report
"""
import json
import logging
from typing import Any

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm_factory import get_llm

log = logging.getLogger(__name__)

EVALUATION_PROMPT = """You are an expert interview coach evaluating a mock interview transcript.
Analyze the conversation below and return ONLY a valid JSON object — no markdown, no explanation.

Interview Type: {interview_type}

Transcript:
{transcript}

Return this exact JSON structure:
{{
  "overall_score": <float 0-10>,
  "technical_score": <float 0-10>,
  "communication_score": <float 0-10>,
  "problem_solving_score": <float 0-10>,
  "culture_fit_score": <float 0-10>,
  "strengths": [<string>, ...],
  "improvements": [<string>, ...],
  "recommendation": "<hire|maybe|pass>",
  "summary": "<2-3 sentence overall assessment>",
  "question_evaluations": [
    {{
      "question": "<interviewer question>",
      "answer": "<candidate answer summary>",
      "score": <float 0-10>,
      "feedback": "<specific coaching feedback>"
    }},
    ...
  ]
}}

Scoring rubric:
- technical_score: depth of knowledge, accuracy, use of concrete examples
- communication_score: clarity, structure, conciseness, active listening
- problem_solving_score: logical approach, creativity, handling of edge cases  
- culture_fit_score: enthusiasm, teamwork signals, growth mindset, alignment
- overall_score: weighted average (technical 35%, communication 30%, problem_solving 20%, culture 15%)

Be honest but constructive. Only evaluate question-answer pairs where the candidate actually answered."""


async def evaluate_session(
    transcript: list[dict],
    interview_type: str,
    llm_provider: str = "openai",
) -> dict[str, Any]:
    """
    Evaluate a completed interview session.

    Args:
        transcript: List of {"role": "user"|"assistant", "content": str}
        interview_type: "general" | "technical" | "behavioral"
        llm_provider: "openai" | "anthropic"

    Returns:
        Structured evaluation dict
    """
    if not transcript:
        return _empty_report()

    # Format transcript for readability
    formatted = "\n\n".join(
        f"{'INTERVIEWER' if m['role'] == 'assistant' else 'CANDIDATE'}: {m['content']}"
        for m in transcript
    )

    llm = get_llm(provider=llm_provider, temperature=0.2)  # low temp for consistent scoring
    prompt = ChatPromptTemplate.from_template(EVALUATION_PROMPT)
    parser = JsonOutputParser()

    chain = prompt | llm | parser

    try:
        result = await chain.ainvoke({
            "transcript": formatted,
            "interview_type": interview_type,
        })
        return _validate_report(result)
    except Exception as e:
        log.error(f"Evaluation failed: {e}")
        return _empty_report()


def _validate_report(data: dict) -> dict:
    """Clamp scores and fill defaults."""
    score_fields = [
        "overall_score", "technical_score", "communication_score",
        "problem_solving_score", "culture_fit_score"
    ]
    for field in score_fields:
        if field in data:
            data[field] = max(0.0, min(10.0, float(data[field])))
        else:
            data[field] = 0.0

    data.setdefault("strengths", [])
    data.setdefault("improvements", [])
    data.setdefault("question_evaluations", [])
    data.setdefault("summary", "")
    data.setdefault("recommendation", "maybe")

    valid_recs = {"hire", "maybe", "pass"}
    if data["recommendation"] not in valid_recs:
        data["recommendation"] = "maybe"

    return data


def _empty_report() -> dict:
    return {
        "overall_score": 0.0,
        "technical_score": 0.0,
        "communication_score": 0.0,
        "problem_solving_score": 0.0,
        "culture_fit_score": 0.0,
        "strengths": [],
        "improvements": ["Session too short to evaluate"],
        "question_evaluations": [],
        "summary": "The session did not have enough content for a full evaluation.",
        "recommendation": "maybe",
    }
