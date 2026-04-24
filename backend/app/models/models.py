from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import JSON, DateTime, Integer, Boolean, String
from datetime import datetime
import enum

class Base(DeclarativeBase):
    pass

class InterviewStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column()
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column()
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class InterviewSession(Base):
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column()
    interview_type: Mapped[str] = mapped_column()
    llm_provider: Mapped[str] = mapped_column()
    status: Mapped[str] = mapped_column(default="pending")
    messages: Mapped[list] = mapped_column(JSON, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=True)
    job_description_id: Mapped[str] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class InterviewReport(Base):
    __tablename__ = "reports"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column()
    overall_score: Mapped[float] = mapped_column()
    technical_score: Mapped[float] = mapped_column()
    communication_score: Mapped[float] = mapped_column()
    problem_solving_score: Mapped[float] = mapped_column()
    culture_fit_score: Mapped[float] = mapped_column()
    summary: Mapped[str] = mapped_column()
    strengths: Mapped[list] = mapped_column(JSON)
    improvements: Mapped[list] = mapped_column(JSON)
    recommendation: Mapped[str] = mapped_column()
    question_evaluations: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)