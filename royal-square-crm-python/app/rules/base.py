from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import date
from app.models.client import Client

class ReminderRule(ABC):
    key: str
    name: str
    frequency: str
    recipient: str
    channel: str
    notice_days: int
    rationale: str

    @abstractmethod
    def evaluate(self, client: Client, today: date) -> Optional[Dict[str, Any]]:
        """Return reminder dict if rule fires, else None."""
        pass
