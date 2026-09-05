from typing import List, Dict, Any, Set
from datetime import date
from crm.rules.base import ReminderRule
from crm.rules.consent_rule import ClientConsentRule
from crm.rules.licence_expiry_rule import LicenceExpiryRule
from crm.rules.review_date_rule import AnnualReviewRule

RULES: List[ReminderRule] = [
    ClientConsentRule(),
    LicenceExpiryRule(),
    AnnualReviewRule()
]

class ReminderEngine:
    @staticmethod
    def list_rules(open_counts: Dict[str, int]) -> List[Dict[str, Any]]:
        return [
            {
                "key": r.key,
                "name": r.name,
                "frequency": r.frequency,
                "recipient": r.recipient,
                "channel": r.channel,
                "noticeDays": r.notice_days,
                "rationale": r.rationale,
                "openCount": open_counts.get(r.key, 0)
            }
            for r in RULES
        ]

    @staticmethod
    def evaluate_all(clients, dismissed_keys: Set[str], today: date = None) -> List[Dict[str, Any]]:
        if today is None:
            today = date.today()
        
        reminders = []
        for client in clients:
            for rule in RULES:
                result = rule.evaluate(client, today)
                if result and result["key"] not in dismissed_keys:
                    reminders.append(result)

        bucket_order = {"OVERDUE": 0, "DUE_SOON": 1, "UPCOMING": 2}
        reminders.sort(key=lambda x: (bucket_order.get(x["bucket"], 99), x["daysUntilDue"]))
        return reminders
