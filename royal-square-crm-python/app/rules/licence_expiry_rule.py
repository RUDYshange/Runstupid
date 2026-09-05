from datetime import date
from typing import Optional, Dict, Any
from app.rules.base import ReminderRule
from app.models.client import Client

class LicenceExpiryRule(ReminderRule):
    key = "LICENCE_EXPIRY"
    name = "Driving Licence Expiry"
    frequency = "FIVE_YEARLY"
    recipient = "CLIENT"
    channel = "SMS"
    notice_days = 60
    rationale = "Notify client before driving licence card expires to avoid insurance repudiation."

    def evaluate(self, client: Client, today: date) -> Optional[Dict[str, Any]]:
        if not client.licence_expiry:
            return None
        days_left = (client.licence_expiry - today).days
        if days_left <= self.notice_days:
            bucket = "OVERDUE" if days_left < 0 else "DUE_SOON"
            return {
                "key": f"{self.key}:{client.id}:{client.licence_expiry.isoformat()}",
                "clientId": client.id,
                "clientName": client.full_name,
                "ruleName": self.name,
                "title": f"Driving licence expiring for {client.full_name}",
                "dueOn": client.licence_expiry,
                "daysUntilDue": days_left,
                "bucket": bucket,
                "recipient": self.recipient,
                "channel": self.channel
            }
        return None
