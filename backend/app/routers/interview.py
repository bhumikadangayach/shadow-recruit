"""
WebSocket Interview Router
──────────────────────────
Handles real-time interview chat over WebSocket.
Protocol:
  Client → { "type": "message", "content": "..." }
  Server → { "type": "chunk",   "content": "..." }   (streaming tokens)
  Server → { "type": "done",    "content": "..." }   (full response)
  Server → { "type": "error",   "content": "..." }
"""
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.chains.eval_chain import evaluate_session
from app.chains.interview_chain import InterviewChain
from app.core.dependencies import get_current_active_user, get_db
from app.core.security import verify_access_token
from app.db.session import AsyncSessionLocal
from app.models.models import InterviewReport, InterviewSession, InterviewStatus, User
from app.schemas.schemas import ReportOut

log = logging.getLogger(__name__)
router = APIRouter(prefix="/interview", tags=["interview"])

# In-memory chain registry {session_id: InterviewChain}
# In production, use Redis for multi-worker deployments
_active_chains: dict[str, InterviewChain] = {}


async def _get_user_from_token(token: str, db: AsyncSession) -> User | None:
    payload = verify_access_token(token)
    if not payload:
        return None
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    return result.scalar_one_or_none()


async def _get_session(session_id: str, user_id: str, db: AsyncSession) -> InterviewSession | None:
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


@router.websocket("/ws/{session_id}")
async def interview_websocket(session_id: str, websocket: WebSocket):
    """
    WebSocket endpoint for live interview.
    Client must send token as first message: {"type": "auth", "token": "<jwt>"}
    """
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        # ── Auth handshake ────────────────────────────────────────────────────
        try:
            raw = await websocket.receive_text()
            auth_msg = json.loads(raw)
        except Exception:
            await websocket.send_json({"type": "error", "content": "Invalid handshake"})
            await websocket.close(code=4001)
            return

        if auth_msg.get("type") != "auth":
            await websocket.send_json({"type": "error", "content": "Expected auth message first"})
            await websocket.close(code=4001)
            return

        user = await _get_user_from_token(auth_msg.get("token", ""), db)
        if not user:
            await websocket.send_json({"type": "error", "content": "Unauthorized"})
            await websocket.close(code=4001)
            return

        # ── Load session ──────────────────────────────────────────────────────
        session = await _get_session(session_id, user.id, db)
        if not session:
            await websocket.send_json({"type": "error", "content": "Session not found"})
            await websocket.close(code=4004)
            return

        if session.status == InterviewStatus.completed:
            await websocket.send_json({"type": "error", "content": "Session already completed"})
            await websocket.close(code=4000)
            return

        # ── Build or restore chain ────────────────────────────────────────────
        if session_id not in _active_chains:
            _active_chains[session_id] = InterviewChain(
                session_id=session_id,
                user_id=user.id,
                interview_type=session.interview_type,
                llm_provider=session.llm_provider,
                jd_id=session.job_description_id,
                history=session.messages or [],
            )

        chain = _active_chains[session_id]

        # Mark as in_progress on first connection
        if session.status == InterviewStatus.pending:
            session.status = InterviewStatus.in_progress
            session.started_at = datetime.now(timezone.utc)
            await db.commit()

        await websocket.send_json({"type": "connected", "content": "Interview session ready"})
        log.info(f"WS connected: session={session_id} user={user.id}")

        # ── Message loop ──────────────────────────────────────────────────────
        try:
            while True:
                raw = await websocket.receive_text()

                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    await websocket.send_json({"type": "error", "content": "Invalid JSON"})
                    continue

                msg_type = msg.get("type")

                # ── Chat message ──────────────────────────────────────────────
                if msg_type == "message":
                    user_content = msg.get("content", "").strip()
                    if not user_content:
                        continue

                    try:
                        response = await chain.chat(user_content)
                        await websocket.send_json({"type": "done", "content": response})

                        # Persist messages to DB
                        session.messages = chain.get_history()
                        await db.commit()

                    except Exception as e:
                        log.error(f"Chain error: {e}")
                        await websocket.send_json({
                            "type": "error",
                            "content": "AI response failed. Please try again.",
                        })

                # ── End interview ─────────────────────────────────────────────
                elif msg_type == "end":
                    now = datetime.now(timezone.utc)
                    session.status = InterviewStatus.completed
                    session.completed_at = now
                    if session.started_at:
                        session.duration_seconds = int((now - session.started_at).total_seconds())
                    session.messages = chain.get_history()
                    await db.commit()

                    await websocket.send_json({"type": "ended", "content": "Interview complete. Generating report..."})

                    # Generate evaluation report
                    try:
                        eval_data = await evaluate_session(
                            transcript=session.messages,
                            interview_type=session.interview_type,
                            llm_provider=session.llm_provider,
                        )
                        report = InterviewReport(session_id=session_id, **eval_data)
                        db.add(report)
                        await db.commit()
                        await db.refresh(report)

                        await websocket.send_json({
                            "type": "report_ready",
                            "content": ReportOut.model_validate(report).model_dump(mode="json"),
                        })
                    except Exception as e:
                        log.error(f"Report generation failed: {e}")

                    _active_chains.pop(session_id, None)
                    break

                # ── Ping ──────────────────────────────────────────────────────
                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})

        except WebSocketDisconnect:
            log.info(f"WS disconnected: session={session_id}")
            # Save progress on disconnect
            if session_id in _active_chains:
                session.messages = _active_chains[session_id].get_history()
                await db.commit()


# ─── REST: Get Report ─────────────────────────────────────────────────────────

@router.get("/sessions/{session_id}/report", response_model=ReportOut)
async def get_report(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the evaluation report for a completed session."""
    from app.db.session import get_db

    result = await db.execute(
        select(InterviewReport)
        .join(InterviewSession)
        .where(
            InterviewReport.session_id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report
