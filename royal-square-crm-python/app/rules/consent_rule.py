from datetime import date, timedelta
from typing import Optional, Dict, Any
from app.rules.base import ReminderRule
from app.models.client import Client

class ClientConsentRule(ReminderRule):
    key = "CLIENT_CONSENT"
    name = "Annual Consent Renewal"
    frequency = "ANNUALLY"
    recipient = "CLIENT"
    channel = "EMAIL"
    notice_days = 30
    rationale = "FAIS requires client consent to be renewed every 12 months."

    def evaluate(self, client: Client, today: date) -> Optional[Dict[str, Any]]:
        consent_doc = next((d for d in client.documents if d.type == "CONSENT"), None)
        if not consent_doc:
            return {
                "key": f"{self.key}:{client.id}:missing",
                "clientId": client.id,
                "clientName": client.full_name,
                "ruleName": self.name,
                "title": f"Consent document missing for {client.full_name}",
                "dueOn": today,
                "daysUntilDue": 0,
                "bucket": "OVERDUE",
                "recipient": self.recipient,
                "channel": self.channel
            }
        
        # Valid for 365 days
        expiry = consent_doc.signed_on + timedelta(days=365)
        days_left = (expiry - today).days
        if days_left <= self.notice_days:
            bucket = "OVERDUE" if days_left < 0 else "DUE_SOON"
            return {
                "key": f"{self.key}:{client.id}:{expiry.isoformat()}",
                "clientId": client.id,
                "clientName": client.full_name,
                "ruleName": self.name,
                "title": f"Consent renewal due for {client.full_name}",
                "dueOn": expiry,
                "daysUntilDue": days_left,
                "bucket": bucket,
                "recipient": self.recipient,
                "channel": self.channel
            }
        return None
