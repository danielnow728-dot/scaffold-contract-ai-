from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contract import Contract, ContractIssue
from app.api.auth import verify_token
from pydantic import BaseModel
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.feedback import Feedback
import json

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
async def chat_with_document(request: ChatRequest, db: Session = Depends(get_db), _=Depends(verify_token)):
    contract = db.query(Contract).filter(Contract.id == request.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Build context from the contract's stored data
    context_parts = []

    # Include financials
    if contract.financials:
        context_parts.append(f"FINANCIAL TERMS:\n{json.dumps(contract.financials, indent=2)}")

    # Include section summary
    if contract.summary_text:
        context_parts.append(f"CONTRACT SECTIONS:\n{contract.summary_text}")

    # Include all identified issues
    issues = db.query(ContractIssue).filter(ContractIssue.contract_id == request.contract_id).all()
    if issues:
        issues_text = []
        for issue in issues:
            issues_text.append(
                f"- [{issue.risk_level}] {issue.category} ({issue.location}): "
                f"{issue.explanation}\n"
                f"  Original: {issue.original_text}\n"
                f"  Option A: {issue.option_a_text}\n"
                f"  Option B: {issue.option_b_text or 'N/A'}"
            )
        context_parts.append(f"IDENTIFIED RISKS & ISSUES:\n" + "\n".join(issues_text))

    # Load the original parsed text from the uploaded file
    import os
    file_path = os.path.join(settings.UPLOAD_DIR, f"{contract.id}_{contract.filename}")
    contract_text = ""
    if os.path.exists(file_path):
        from app.services.document_parser import parse_document
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        try:
            contract_text = parse_document(contract.filename, file_bytes)
            # Limit to ~20k chars to stay within context limits
            if len(contract_text) > 20000:
                contract_text = contract_text[:20000] + "\n\n[... CONTRACT TEXT TRUNCATED FOR CONTEXT LIMIT ...]"
        except Exception:
            contract_text = "[Could not re-parse contract file]"

    if contract_text:
        context_parts.append(f"FULL CONTRACT TEXT:\n{contract_text}")

    context = "\n\n---\n\n".join(context_parts) if context_parts else "No contract data available."

    system_message = (
        "You are a helpful contract assistant for C & D Energy Services, LLC (CD Specialty Contractors / Colorado Scaffolding). "
        "You specialize in scaffolding rental, labor, and materials contracts. "
        "Answer user questions based strictly on the contract data provided below. "
        "If the answer is not in the provided data, say so. "
        "Be concise and practical — the user is likely a project manager or estimator preparing for a negotiation.\n\n"
        f"CONTRACT DATA FOR CONTRACT #{request.contract_id} ({contract.filename}):\n\n{context}"
    )

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": request.user_message}
        ],
        temperature=0.2
    )
    return {"reply": response.choices[0].message.content}

@router.post("/feedback")
async def save_feedback(request: FeedbackRequest, db: Session = Depends(get_db), _=Depends(verify_token)):
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
