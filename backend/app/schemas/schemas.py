from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserOut(BaseModel):
    id: str
    full_name: str
    email: str

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SessionCreate(BaseModel):
    interview_type: str = "general"
    llm_provider: str = "openai"
    job_description_id: Optional[str] = None

class SessionOut(BaseModel):
    id: str
    user_id: str
    interview_type: str
    llm_provider: str
    status: str
    duration_seconds: Optional[int] = None
    job_description_id: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class QuestionEvaluation(BaseModel):
    question: str
    answer: str
    score: float
    feedback: str

class ReportOut(BaseModel):
    id: int
    session_id: str
    overall_score: float
    technical_score: float
    communication_score: float
    problem_solving_score: float
    culture_fit_score: float
    summary: str
    strengths: list[str]
    improvements: list[str]
    recommendation: str
    question_evaluations: list[QuestionEvaluation]
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}