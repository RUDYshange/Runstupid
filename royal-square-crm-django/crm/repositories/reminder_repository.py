from typing import Set
from crm.models import ReminderDismissal

class ReminderRepository:
    @staticmethod
    def get_dismissed_keys() -> Set[str]:
        return set(ReminderDismissal.objects.values_list('reminder_key', flat=True))

    @staticmethod
    def dismiss(reminder_key: str) -> bool:
        ReminderDismissal.objects.get_or_create(reminder_key=reminder_key)
        return True
