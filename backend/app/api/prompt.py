from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.database import get_db
from app.models.contract import SystemPrompt
from app.api.auth import verify_token
from sqlalchemy.orm import Session
from pathlib import Path
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Load the default prompt from the markdown file
DEFAULT_PROMPT_PATH = Path(__file__).resolve().parent.parent / "core" / "scaffolding_prompt.md"


def _read_default_prompt() -> str:
    try:
        return DEFAULT_PROMPT_PATH.read_text(encoding="utf-8")
    except Exception as e:
        logger.error(f"Failed to read default prompt file: {e}")
        return "You are an expert scaffolding contract reviewer."


def get_active_prompt(db: Session) -> str:
    """Return the active prompt from DB, or fall back to the default file."""
    row = db.query(SystemPrompt).filter(SystemPrompt.is_active == True).order_by(SystemPrompt.updated_at.desc()).first()
    if row:
        return row.content
    return _read_default_prompt()


class PromptUpdate(BaseModel):
    content: str


class PromptResponse(BaseModel):
    content: str
    is_default: bool


@router.get("", response_model=PromptResponse)
def get_prompt(db: Session = Depends(get_db), _=Depends(verify_token)):
    row = db.query(SystemPrompt).filter(SystemPrompt.is_active == True).order_by(SystemPrompt.updated_at.desc()).first()
    if row:
        return PromptResponse(content=row.content, is_default=False)
    return PromptResponse(content=_read_default_prompt(), is_default=True)


@router.put("", response_model=PromptResponse)
def update_prompt(body: PromptUpdate, db: Session = Depends(get_db), _=Depends(verify_token)):
    # Deactivate any existing active prompts
    db.query(SystemPrompt).filter(SystemPrompt.is_active == True).update({"is_active": False})
    # Create a new active prompt
    new_prompt = SystemPrompt(content=body.content, is_active=True)
    db.add(new_prompt)
    db.commit()
    db.refresh(new_prompt)
    return PromptResponse(content=new_prompt.content, is_default=False)


@router.post("/reset", response_model=PromptResponse)
def reset_prompt(db: Session = Depends(get_db), _=Depends(verify_token)):
    """Reset to the default prompt by deactivating all custom prompts."""
    db.query(SystemPrompt).filter(SystemPrompt.is_active == True).update({"is_active": False})
    db.commit()
    return PromptResponse(content=_read_default_prompt(), is_default=True)
