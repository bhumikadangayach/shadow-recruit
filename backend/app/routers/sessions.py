from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid

from app.core.dependencies import get_db, get_current_active_user
from app.models.models import InterviewSession, InterviewReport, User
from app.schemas.schemas import SessionOut, ReportOut

router = APIRouter(prefix="/sessions", tags=["sessions"])

class SessionCreate(BaseModel):
    interview_type: str = "general"
    llm_provider: str = "openai"
    job_description_id: Optional[str] = None

@router.post("", response_model=SessionOut)
async def create_session(
    body: SessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    session = InterviewSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        interview_type=body.interview_type,
        llm_provider=body.llm_provider,
        job_description_id=body.job_description_id,
        status="pending",
        messages=[],
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

@router.get("", response_model=list[SessionOut])
async def list_sessions(
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/{session_id}/report", response_model=ReportOut)
async def get_session_report(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewReport).where(InterviewReport.session_id == session_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/analytics/summary")
async def get_analytics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    # Get all completed sessions with reports
    sessions_result = await db.execute(
        select(InterviewSession)
        .where(
            InterviewSession.user_id == current_user.id,
            InterviewSession.status == "completed",
        )
        .order_by(InterviewSession.created_at.asc())
    )
    sessions = sessions_result.scalars().all()

    if not sessions:
        return {
            "total_sessions": 0,
            "completed_sessions": 0,
            "avg_overall_score": 0,
            "avg_technical_score": 0,
            "avg_communication_score": 0,
            "avg_problem_solving_score": 0,
            "avg_culture_fit_score": 0,
            "score_trend": [],
            "type_breakdown": {},
            "improvement": 0,
        }

    session_ids = [s.id for s in sessions]
    reports_result = await db.execute(
        select(InterviewReport).where(InterviewReport.session_id.in_(session_ids))
    )
    reports = reports_result.scalars().all()
    reports_by_session = {r.session_id: r for r in reports}

    # Score trend over time
    trend = []
    for s in sessions:
        r = reports_by_session.get(s.id)
        if r:
            trend.append({
                "date": s.created_at.strftime("%b %d") if s.created_at else "",
                "overall": round(r.overall_score, 1),
                "technical": round(r.technical_score, 1),
                "communication": round(r.communication_score, 1),
                "problem_solving": round(r.problem_solving_score, 1),
                "culture_fit": round(r.culture_fit_score, 1),
                "interview_type": s.interview_type,
            })

    # Averages
    def avg(values):
        return round(sum(values) / len(values), 1) if values else 0

    overall_scores = [r.overall_score for r in reports]
    improvement = 0
    if len(overall_scores) >= 2:
        improvement = round(overall_scores[-1] - overall_scores[0], 1)

    # Type breakdown
    type_breakdown = {}
    for s in sessions:
        t = s.interview_type
        type_breakdown[t] = type_breakdown.get(t, 0) + 1

    all_sessions_result = await db.execute(
        select(InterviewSession).where(InterviewSession.user_id == current_user.id)
    )
    all_sessions = all_sessions_result.scalars().all()

    return {
        "total_sessions": len(all_sessions),
        "completed_sessions": len(sessions),
        "avg_overall_score": avg(overall_scores),
        "avg_technical_score": avg([r.technical_score for r in reports]),
        "avg_communication_score": avg([r.communication_score for r in reports]),
        "avg_problem_solving_score": avg([r.problem_solving_score for r in reports]),
        "avg_culture_fit_score": avg([r.culture_fit_score for r in reports]),
        "score_trend": trend,
        "type_breakdown": type_breakdown,
        "improvement": improvement,
    }