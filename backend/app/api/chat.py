from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contract import Contract
from pydantic import BaseModel
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.feedback import Feedback

router = APIRouter()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class ChatRequest(BaseModel):
    contract_id: int
    user_message: str

class FeedbackRequest(BaseModel):
    contract_id: int
    issue_id: int
    original_text: str
    ai_suggestion: str
    user_decision: str
    user_modified_text: str | None = None

@router.post("/")
async def chat_with_document(request: ChatRequest, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == request.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    # We would retrieve context from vector DB or full DB text based on question.
    # For MVP, we pass a system prompt emphasizing Q&A based on local documents.
    prompt = f"The user asks regarding contract ID {request.contract_id}: '{request.user_message}'"
    
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful contract assistant. Answer user queries based strictly on the uploaded scaffolding contract."},
            {"role": "user", "content": prompt}
        ]
    )
    return {"reply": response.choices[0].message.content}

@router.post("/feedback")
async def save_feedback(request: FeedbackRequest, db: Session = Depends(get_db)):
    """Saves user modifications to train the system later (Dynamic Learning Loop)."""
    feedback = Feedback(
        contract_id=request.contract_id,
        issue_id=request.issue_id,
        original_text=request.original_text,
        ai_suggestion=request.ai_suggestion,
        user_decision=request.user_decision,
        user_modified_text=request.user_modified_text
    )
    db.add(feedback)
    db.commit()
    return {"message": "Feedback saved for future learning."}
