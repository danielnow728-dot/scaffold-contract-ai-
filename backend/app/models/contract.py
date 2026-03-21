from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from app.core.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")
    
    # Financials & Summary
    summary_text = Column(Text, nullable=True)
    financials = Column(JSON, nullable=True)
    
class ContractIssue(Base):
    __tablename__ = "contract_issues"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, index=True)
    category = Column(String)  # e.g., "Retention", "Pay-If-Paid"
    original_text = Column(Text)
    location = Column(String)  # e.g., "Page 3, Section 4.1"
    risk_level = Column(String) # e.g., "High", "Medium"
    explanation = Column(Text)
    
    # Options for client
    option_a_text = Column(Text) # Most protective
    option_b_text = Column(Text, nullable=True) # Compromise
