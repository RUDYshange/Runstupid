from datetime import date
from typing import Optional, Dict, Any
from app.rules.base import ReminderRule
from app.models.client import Client

class AnnualReviewRule(ReminderRule):
    key = "ANNUAL_REVIEW"
    name = "Annual Portfolio Review"
    frequency = "ANNUALLY"
    recipient = "ADVISER"
    channel = "CALENDAR"
    notice_days = 45
    rationale = "Financial advisory code of conduct mandates annual review meetings."

    def evaluate(self, client: Client, today: date) -> Optional[Dict[str, Any]]:
        if not client.next_review_date:
            return None
        days_left = (client.next_review_date - today).days
        if days_left <= self.notice_days:
            bucket = "OVERDUE" if days_left < 0 else ("DUE_SOON" if days_left <= 14 else "UPCOMING")
            return {
                "key": f"{self.key}:{client.id}:{client.next_review_date.isoformat()}",
                "clientId": client.id,
                "clientName": client.full_name,
                "ruleName": self.name,
                "title": f"Annual review due for {client.full_name}",
                "dueOn": client.next_review_date,
                "daysUntilDue": days_left,
                "bucket": bucket,
                "recipient": self.recipient,
                "channel": self.channel
            }
        return None
