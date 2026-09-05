from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.claim import Claim, SCENE_ITEMS
from app.repositories.claim_repository import ClaimRepository

class ClaimService:
    @staticmethod
    def to_response(claim: Claim) -> Dict[str, Any]:
        return {
            "id": claim.id,
            "reference": claim.reference,
            "clientId": claim.client_id,
            "clientName": claim.client.full_name if claim.client else "Unknown",
            "insurer": claim.insurer,
            "policyNumber": claim.policy_number,
            "insurerClaimNumber": claim.insurer_claim_number,
            "claimsHandler": claim.claims_handler,
            "claimType": claim.claim_type,
            "incidentDate": claim.incident_date,
            "lodgedDate": claim.lodged_date,
            "description": claim.description,
            "stage": claim.stage,
            "stepNumber": claim.step_number(),
            "totalSteps": claim.total_steps(),
            "closed": claim.is_closed(),
            "sceneChecklist": [
                {
                    "item": item,
                    "label": item.replace("_", " ").title(),
                    "done": claim.has_gathered(item)
                }
                for item in SCENE_ITEMS
            ],
            "log": [
                {
                    "text": log.text,
                    "recordedAt": log.recorded_at
                }
                for log in claim.logs
            ]
        }

    @staticmethod
    def list_claims(db: Session) -> List[Dict[str, Any]]:
        claims = ClaimRepository.get_all(db)
        return [ClaimService.to_response(c) for c in claims]

    @staticmethod
    def get_claim(db: Session, claim_id: str) -> Optional[Dict[str, Any]]:
        claim = ClaimRepository.get_by_id(db, claim_id)
        if not claim:
            return None
        return ClaimService.to_response(claim)

    @staticmethod
    def create_claim(db: Session, data: dict) -> Dict[str, Any]:
        mapped = {
            "client_id": data["clientId"],
            "insurer": data["insurer"],
            "claim_type": data["claimType"],
            "incident_date": data["incidentDate"],
            "lodged_date": data.get("lodgedDate") or data["incidentDate"],
            "description": data.get("description"),
            "policy_number": data.get("policyNumber"),
            "stage": "REGISTERED"
        }
        claim = ClaimRepository.create(db, mapped)
        return ClaimService.to_response(claim)

    @staticmethod
    def advance_stage(db: Session, claim_id: str) -> Optional[Dict[str, Any]]:
        claim = ClaimRepository.get_by_id(db, claim_id)
        if not claim:
            return None
        ClaimRepository.advance_stage(db, claim)
        return ClaimService.to_response(claim)

    @staticmethod
    def toggle_scene_item(db: Session, claim_id: str, item: str) -> Optional[Dict[str, Any]]:
        claim = ClaimRepository.get_by_id(db, claim_id)
        if not claim:
            return None
        ClaimRepository.toggle_scene_item(db, claim, item)
        return ClaimService.to_response(claim)
