import random
from typing import Optional
from crm.models import Claim, ClaimSceneItem, ClaimLogEntry

class ClaimRepository:
    @staticmethod
    def get_all():
        return Claim.objects.select_related('client').prefetch_related('scene_items', 'logs').all()

    @staticmethod
    def get_by_id(claim_id: str) -> Optional[Claim]:
        try:
            return Claim.objects.select_related('client').prefetch_related('scene_items', 'logs').get(id=claim_id)
        except (Claim.DoesNotExist, ValueError):
            return None

    @staticmethod
    def generate_reference() -> str:
        while True:
            ref = f"CLM-{random.randint(1000, 9999)}"
            if not Claim.objects.filter(reference=ref).exists():
                return ref

    @staticmethod
    def create(data: dict) -> Claim:
        if "reference" not in data or not data["reference"]:
            data["reference"] = ClaimRepository.generate_reference()
        claim = Claim.objects.create(**data)
        ClaimLogEntry.objects.create(claim=claim, text=f"Claim registered with {claim.insurer}")
        return claim

    @staticmethod
    def advance_stage(claim: Claim) -> Claim:
        claim.advance()
        return claim

    @staticmethod
    def toggle_scene_item(claim: Claim, item_name: str) -> Claim:
        existing = ClaimSceneItem.objects.filter(claim=claim, item=item_name).first()
        if existing:
            existing.delete()
            ClaimLogEntry.objects.create(claim=claim, text=f"Checklist item unchecked: {item_name}")
        else:
            ClaimSceneItem.objects.create(claim=claim, item=item_name)
            ClaimLogEntry.objects.create(claim=claim, text=f"Checklist item gathered: {item_name}")
        return claim
