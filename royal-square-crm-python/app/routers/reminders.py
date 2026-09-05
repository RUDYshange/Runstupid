from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.reminder import ReminderResponse, RuleResponse
from app.services.reminder_service import ReminderService

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])

class DismissRequest(BaseModel):
    key: str

@router.get("", response_model=List[ReminderResponse])
def list_reminders(db: Session = Depends(get_db)):
    return ReminderService.get_open_reminders(db)

@router.get("/rules", response_model=List[RuleResponse])
def list_rules(db: Session = Depends(get_db)):
    return ReminderService.get_rules_summary(db)

@router.post("/dismiss")
def dismiss_reminder(req: DismissRequest, db: Session = Depends(get_db)):
    ReminderService.dismiss_reminder(db, req.key)
    return {"status": "dismissed", "key": req.key}
