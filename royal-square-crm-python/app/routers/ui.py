from fastapi import APIRouter
from app.services.ui_service import UIService

router = APIRouter(prefix="/api/ui", tags=["Server Driven UI"])

@router.get("/schemas/client-form")
def get_client_form_schema():
    """Returns dynamic schema for Client Registration / Onboarding."""
    return UIService.get_client_form_schema()

@router.get("/schemas/claim-form")
def get_claim_form_schema():
    """Returns dynamic schema for Claim Registration."""
    return UIService.get_claim_form_schema()
