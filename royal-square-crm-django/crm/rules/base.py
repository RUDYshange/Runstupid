from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import date
from crm.models import Client

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
        pass
