from pydantic import BaseModel
from typing import Optional
from datetime import date

class ReminderResponse(BaseModel):
    key: str
    clientId: str
    clientName: str
    ruleName: str
    title: str
    dueOn: Optional[date]=None
    daysUntilDue: int
    bucket: str
    recipient: str
    channel: str

class RuleResponse(BaseModel):
    key: str
    name: str
    frequency: str
    recipient: str
    channel: str
    noticeDays: int
    rationale: str
    openCount: int
