from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import uuid

from app.core.dependencies import get_db, get_current_active_user
from app.models.models import User

router = APIRouter(prefix="/jobs", tags=["jobs"])

class JobDescriptionIn(BaseModel):
    title: str
    company: Optional[str] = None
    description: str

class JobDescriptionOut(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    description: str
    user_id: str

# In-memory store (replace with DB table in production)
_jd_store: dict[str, dict] = {}

@router.post("", response_model=JobDescriptionOut)
async def create_jd(
    body: JobDescriptionIn,
    current_user: User = Depends(get_current_active_user),
):
    jd_id = str(uuid.uuid4())
    from app.rag.ingestion import ingest_jd
    ingest_jd(jd_id=jd_id, text=f"{body.title}\n{body.company or ''}\n{body.description}")

    jd = {
        "id": jd_id,
        "title": body.title,
        "company": body.company,
        "description": body.description,
        "user_id": current_user.id,
    }
    _jd_store[jd_id] = jd
    # Store latest JD per user for easy lookup
    _jd_store[f"user_{current_user.id}"] = jd
    return JobDescriptionOut(**jd)

@router.get("", response_model=list[JobDescriptionOut])
async def list_jds(current_user: User = Depends(get_current_active_user)):
    return [
        JobDescriptionOut(**v)
        for k, v in _jd_store.items()
        if not k.startswith("user_") and v.get("user_id") == current_user.id
    ]

@router.get("/{jd_id}", response_model=JobDescriptionOut)
async def get_jd(
    jd_id: str,
    current_user: User = Depends(get_current_active_user),
):
    jd = _jd_store.get(jd_id)
    if not jd or jd["user_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="Job description not found")
    return JobDescriptionOut(**jd)

@router.delete("/{jd_id}")
async def delete_jd(
    jd_id: str,
    current_user: User = Depends(get_current_active_user),
):
    jd = _jd_store.pop(jd_id, None)
    if not jd or jd["user_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    # Remove user lookup if it pointed to this JD
    if _jd_store.get(f"user_{current_user.id}", {}).get("id") == jd_id:
        _jd_store.pop(f"user_{current_user.id}", None)
    return {"message": "Deleted"}