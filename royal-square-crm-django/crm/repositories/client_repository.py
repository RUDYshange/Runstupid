import random
from typing import List, Optional
from django.db.models import Q
from crm.models import Client, LedgerEntry, Goal, Policy, ComplianceDocument

class ClientRepository:
    @staticmethod
    def get_all(search: Optional[str] = None):
        qs = Client.objects.prefetch_related('ledger_entries', 'goals', 'policies', 'documents').all()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(surname__icontains=search) |
                Q(reference__icontains=search) |
                Q(id_number__icontains=search) |
                Q(email_address__icontains=search)
            )
        return qs

    @staticmethod
    def get_by_id(client_id: str) -> Optional[Client]:
        try:
            return Client.objects.prefetch_related('ledger_entries', 'goals', 'policies', 'documents').get(id=client_id)
        except (Client.DoesNotExist, ValueError):
            return None

    @staticmethod
    def generate_reference() -> str:
        while True:
            ref = f"CLI-{random.randint(1000, 9999)}"
            if not Client.objects.filter(reference=ref).exists():
                return ref

    @staticmethod
    def create(data: dict) -> Client:
        if "reference" not in data or not data["reference"]:
            data["reference"] = ClientRepository.generate_reference()
        return Client.objects.create(**data)

    @staticmethod
    def update(client: Client, data: dict) -> Client:
        for k, v in data.items():
            if hasattr(client, k) and v is not None:
                setattr(client, k, v)
        client.save()
        return client
