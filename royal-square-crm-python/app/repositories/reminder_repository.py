from typing import Set
from sqlalchemy.orm import Session
from app.models.reminder import ReminderDismissal

class ReminderRepository:
    @staticmethod
    def get_dismissed_keys(db: Session) -> Set[str]:
        rows = db.query(ReminderDismissal.reminder_key).all()
        return {r[0] for r in rows}

    @staticmethod
    def dismiss(db: Session, reminder_key: str) -> bool:
        existing = db.query(ReminderDismissal).filter(ReminderDismissal.reminder_key == reminder_key).first()
        if not existing:
            dismissal = ReminderDismissal(reminder_key=reminder_key)
            db.add(dismissal)
            db.commit()
        return True
