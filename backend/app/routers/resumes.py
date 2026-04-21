from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid, os, shutil

from app.core.dependencies import get_db, get_current_active_user
from app.core.config import settings
from app.models.models import User

router = APIRouter(prefix="/resumes", tags=["resumes"])

class ResumeOut(BaseModel):
    id: str
    filename: str
    user_id: str

# In-memory store for simplicity (replace with DB table in production)
_resume_store: dict[str, dict] = {}

@router.post("/upload", response_model=ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    if not file.filename.endswith(('.pdf', '.txt', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF, TXT, DOCX files are supported")

    resume_id = str(uuid.uuid4())
    upload_path = os.path.join(settings.upload_dir, f"{current_user.id}_{resume_id}_{file.filename}")

    os.makedirs(settings.upload_dir, exist_ok=True)
    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Index into RAG
    from app.rag.ingestion import ingest_resume
    ingest_resume(user_id=current_user.id, file_path=upload_path)

    _resume_store[current_user.id] = {
        "id": resume_id,
        "filename": file.filename,
        "user_id": current_user.id,
        "path": upload_path,
    }

    return ResumeOut(id=resume_id, filename=file.filename, user_id=current_user.id)

@router.get("/", response_model=Optional[ResumeOut])
async def get_resume(current_user: User = Depends(get_current_active_user)):
    resume = _resume_store.get(current_user.id)
    if not resume:
        return None
    return ResumeOut(**{k: resume[k] for k in ['id', 'filename', 'user_id']})

@router.delete("/")
async def delete_resume(current_user: User = Depends(get_current_active_user)):
    resume = _resume_store.pop(current_user.id, None)
    if resume and os.path.exists(resume["path"]):
        os.remove(resume["path"])
    return {"message": "Resume deleted"}