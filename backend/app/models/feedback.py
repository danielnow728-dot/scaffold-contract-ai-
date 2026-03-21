from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from datetime import datetime
from app.core.database import Base

class Feedback(Base):
    __tablename__ = "feedback_logs"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, index=True)
    issue_id = Column(Integer, index=True, nullable=True) # Linked to ContractIssue
    original_text = Column(Text)
    ai_suggestion = Column(Text)
    user_decision = Column(String)  # e.g., "Accepted A", "Accepted B", "Modified", "Rejected"
    user_modified_text = Column(Text, nullable=True) # If user modifies it further
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # We use these records later as few-shot examples in instructions
    # to teach the model how the user likes their contracts adjusted.
