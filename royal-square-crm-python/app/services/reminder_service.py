from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.repositories.client_repository import ClientRepository
from app.repositories.reminder_repository import ReminderRepository
from app.rules.engine import ReminderEngine

class ReminderService:
    @staticmethod
    def get_open_reminders(db: Session) -> List[Dict[str, Any]]:
        clients = ClientRepository.get_all(db)
        dismissed = ReminderRepository.get_dismissed_keys(db)
        return ReminderEngine.evaluate_all(clients, dismissed)

    @staticmethod
    def get_rules_summary(db: Session) -> List[Dict[str, Any]]:
        reminders = ReminderService.get_open_reminders(db)
        counts = {}
        for r in reminders:
            rule_key = r["key"].split(":")[0]
            counts[rule_key] = counts.get(rule_key, 0) + 1
        return ReminderEngine.list_rules(counts)

    @staticmethod
    def dismiss_reminder(db: Session, reminder_key: str) -> bool:
        return ReminderRepository.dismiss(db, reminder_key)
