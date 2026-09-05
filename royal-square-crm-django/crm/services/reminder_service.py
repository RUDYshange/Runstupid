from typing import List, Dict, Any
from crm.repositories.client_repository import ClientRepository
from crm.repositories.reminder_repository import ReminderRepository
from crm.rules.engine import ReminderEngine

class ReminderService:
    @staticmethod
    def get_open_reminders() -> List[Dict[str, Any]]:
        clients = ClientRepository.get_all()
        dismissed = ReminderRepository.get_dismissed_keys()
        return ReminderEngine.evaluate_all(clients, dismissed)

    @staticmethod
    def get_rules_summary() -> List[Dict[str, Any]]:
        reminders = ReminderService.get_open_reminders()
        counts = {}
        for r in reminders:
            rule_key = r["key"].split(":")[0]
            counts[rule_key] = counts.get(rule_key, 0) + 1
        return ReminderEngine.list_rules(counts)

    @staticmethod
    def dismiss_reminder(reminder_key: str) -> bool:
        return ReminderRepository.dismiss(reminder_key)
