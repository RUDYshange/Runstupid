from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.claim import Claim, ClaimLogEntry, ClaimSceneItem, SCENE_ITEMS
import random

class ClaimRepository:
    @staticmethod
    def get_all(db: Session) -> List[Claim]:
        return db.query(Claim).order_by(Claim.created_at.desc()).all()

    @staticmethod
    def get_by_id(db: Session, claim_id: str) -> Optional[Claim]:
        return db.query(Claim).filter(Claim.id == claim_id).first()

    @staticmethod
    def generate_reference(db: Session) -> str:
        while True:
            ref = f"CLM-{random.randint(1000, 9999)}"
            if not db.query(Claim).filter(Claim.reference == ref).first():
                return ref

    @staticmethod
    def create(db: Session, data: dict) -> Claim:
        if "reference" not in data or not data["reference"]:
            data["reference"] = ClaimRepository.generate_reference(db)
        claim = Claim(**data)
        db.add(claim)
        db.flush()
        # initial log
        db.add(ClaimLogEntry(claim_id=claim.id, text=f"Claim registered with {claim.insurer}"))
        db.commit()
        db.refresh(claim)
        return claim

    @staticmethod
    def advance_stage(db: Session, claim: Claim) -> Claim:
        claim.advance()
        db.commit()
        db.refresh(claim)
        return claim

    @staticmethod
    def toggle_scene_item(db: Session, claim: Claim, item_name: str) -> Claim:
        existing = db.query(ClaimSceneItem).filter(
            ClaimSceneItem.claim_id == claim.id,
            ClaimSceneItem.item == item_name
        ).first()

        if existing:
            db.delete(existing)
            db.add(ClaimLogEntry(claim_id=claim.id, text=f"Checklist item unchecked: {item_name}"))
        else:
            db.add(ClaimSceneItem(claim_id=claim.id, item=item_name))
            db.add(ClaimLogEntry(claim_id=claim.id, text=f"Checklist item gathered: {item_name}"))
        
        db.commit()
        db.refresh(claim)
        return claim
