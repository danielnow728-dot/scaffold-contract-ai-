from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
import os

router = APIRouter()

class LoginRequest(BaseModel):
    passcode: str

# Default beta password if environment variable is not explicitly set in Render
MASTER_PASSCODE = os.getenv("MASTER_PASSCODE", "CDSpecialty2026!")

@router.post("/login")
def login(req: LoginRequest):
    # Validating the strict master passcode
    if req.passcode == MASTER_PASSCODE:
        # For this Beta, we issue a static cryptographic token.
        # In V2, we will migrate to time-expiring JWTs.
        return {"token": "cd-secure-beta-token-valid-9941"}
    
    raise HTTPException(status_code=401, detail="Unauthorized: Invalid Passcode")

def verify_token(authorization: str = Header(None)):
    if not authorization or authorization != "Bearer cd-secure-beta-token-valid-9941":
        raise HTTPException(status_code=401, detail="Not authenticated")
    return True
