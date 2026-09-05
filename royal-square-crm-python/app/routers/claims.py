from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.claim import ClaimResponse, RegisterClaimRequest
from app.services.claim_service import ClaimService

router = APIRouter(prefix="/api/claims", tags=["Claims"])

@router.get("", response_model=List[ClaimResponse])
def list_claims(db: Session = Depends(get_db)):
    return ClaimService.list_claims(db)

@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(claim_id: str, db: Session = Depends(get_db)):
    claim = ClaimService.get_claim(db, claim_id)
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return claim

@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def lodge_claim(req: RegisterClaimRequest, db: Session = Depends(get_db)):
    try:
        return ClaimService.create_claim(db, req.model_dump())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{claim_id}/advance", response_model=ClaimResponse)
def advance_stage(claim_id: str, db: Session = Depends(get_db)):
    res = ClaimService.advance_stage(db, claim_id)
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return res

@router.post("/{claim_id}/checklist/{item}/toggle", response_model=ClaimResponse)
def toggle_checklist_item(claim_id: str, item: str, db: Session = Depends(get_db)):
    res = ClaimService.toggle_scene_item(db, claim_id, item)
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return res
