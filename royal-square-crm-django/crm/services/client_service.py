from datetime import date
from decimal import Decimal
from typing import Optional, Dict, Any, List
from crm.models import Client
from crm.repositories.client_repository import ClientRepository

MANDATORY_DOC_TYPES = ["ID", "PROOF_OF_RESIDENCE", "CONSENT", "ADVICE_RECORD"]

class ClientService:
    @staticmethod
    def mask_id_number(id_num: Optional[str]) -> Optional[str]:
        if not id_num:
            return None
        clean = id_num.strip()
        if len(clean) == 13:
            return f"{clean[:6]} **** ***"
        return f"{clean[:4]} ****" if len(clean) > 4 else "****"

    @staticmethod
    def calculate_age(dob: Optional[date]) -> Optional[int]:
        if not dob:
            return None
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @staticmethod
    def compute_balance_sheet(client: Client) -> Dict[str, Any]:
        assets = []
        liabilities = []
        income = []
        expenses = []

        for e in client.ledger_entries.all():
            line = {
                "id": str(e.id),
                "label": e.label,
                "amount": e.amount,
                "creditor": e.creditor,
                "interestRate": float(e.interest_rate) if e.interest_rate else None
            }
            if e.category == "ASSET":
                assets.append(line)
            elif e.category == "LIABILITY":
                liabilities.append(line)
            elif e.category == "INCOME":
                income.append(line)
            elif e.category == "EXPENSE":
                expenses.append(line)

        total_assets = sum((l["amount"] for l in assets), Decimal("0.00"))
        total_liabilities = sum((l["amount"] for l in liabilities), Decimal("0.00"))
        net_worth = total_assets - total_liabilities

        monthly_income = sum((l["amount"] for l in income), Decimal("0.00"))
        monthly_expenses = sum((l["amount"] for l in expenses), Decimal("0.00"))
        monthly_surplus = monthly_income - monthly_expenses

        debt_to_assets = float((total_liabilities / total_assets) * 100) if total_assets > 0 else 0.0
        months_covered = float(total_assets / monthly_expenses) if monthly_expenses > 0 else 0.0

        return {
            "assets": assets,
            "liabilities": liabilities,
            "income": income,
            "expenses": expenses,
            "totalAssets": total_assets,
            "totalLiabilities": total_liabilities,
            "netWorth": net_worth,
            "monthlyIncome": monthly_income,
            "monthlyExpenses": monthly_expenses,
            "monthlySurplus": monthly_surplus,
            "debtToAssetsPercent": round(debt_to_assets, 1),
            "monthsOfExpensesCovered": round(months_covered, 1)
        }

    @staticmethod
    def calculate_compliance_gaps(client: Client) -> int:
        present_types = {d.type for d in client.documents.all()}
        return sum(1 for m in MANDATORY_DOC_TYPES if m not in present_types)

    @classmethod
    def to_summary(cls, client: Client) -> Dict[str, Any]:
        bs = cls.compute_balance_sheet(client)
        today = date.today()
        days_until_review = (client.next_review_date - today).days if client.next_review_date else None
        initials = "".join([part[0].upper() for part in (client.first_name + " " + client.surname).split() if part])

        return {
            "id": str(client.id),
            "reference": client.reference,
            "fullName": client.full_name,
            "initials": initials,
            "occupation": client.occupation,
            "employer": client.employer,
            "mobileNumber": client.mobile_number,
            "netWorth": bs["netWorth"],
            "riskProfile": client.risk_profile,
            "riskScore": client.risk_score,
            "complianceGapCount": cls.calculate_compliance_gaps(client),
            "nextReviewDate": client.next_review_date,
            "daysUntilReview": days_until_review
        }

    @classmethod
    def to_detail(cls, client: Client) -> Dict[str, Any]:
        bs = cls.compute_balance_sheet(client)
        return {
            "id": str(client.id),
            "reference": client.reference,
            "title": client.title,
            "fullName": client.full_name,
            "maskedIdNumber": cls.mask_id_number(client.id_number),
            "dateOfBirth": client.date_of_birth,
            "age": cls.calculate_age(client.date_of_birth),
            "occupation": client.occupation,
            "employer": client.employer,
            "annualIncome": client.annual_income,
            "mobileNumber": client.mobile_number,
            "emailAddress": client.email_address,
            "primaryAddress": client.primary_address,
            "licenceExpiry": client.licence_expiry,
            "clientSince": client.client_since,
            "nextReviewDate": client.next_review_date,
            "riskProfile": client.risk_profile,
            "riskScore": client.risk_score,
            "netWorth": bs["netWorth"],
            "balanceSheet": bs,
            "goals": [
                {
                    "id": str(g.id),
                    "name": g.name,
                    "kind": g.kind,
                    "targetAmount": g.target_amount,
                    "currentAmount": g.current_amount,
                    "monthlyContribution": g.monthly_contribution,
                    "startDate": g.start_date,
                    "targetDate": g.target_date,
                    "vehicle": g.vehicle,
                    "progressPercent": round(float((g.current_amount / g.target_amount) * 100), 1) if g.target_amount > 0 else 0.0
                }
                for g in client.goals.all()
            ],
            "policies": [
                {
                    "id": str(p.id),
                    "provider": p.provider,
                    "productType": p.product_type,
                    "policyNumber": p.policy_number,
                    "sumAssured": p.sum_assured,
                    "monthlyPremium": p.monthly_premium,
                    "renewalDate": p.renewal_date
                }
                for p in client.policies.all()
            ],
            "documents": [
                {
                    "id": str(d.id),
                    "type": d.type,
                    "signedOn": d.signed_on,
                    "storageKey": d.storage_key
                }
                for d in client.documents.all()
            ]
        }

    @staticmethod
    def list_clients(search: Optional[str] = None) -> List[Dict[str, Any]]:
        clients = ClientRepository.get_all(search)
        return [ClientService.to_summary(c) for c in clients]

    @staticmethod
    def get_client_detail(client_id: str) -> Optional[Dict[str, Any]]:
        client = ClientRepository.get_by_id(client_id)
        if not client:
            return None
        return ClientService.to_detail(client)

    @staticmethod
    def create_client(data: dict) -> Dict[str, Any]:
        mapped = {
            "title": data.get("title"),
            "first_name": data.get("firstName"),
            "second_name": data.get("secondName"),
            "surname": data.get("surname"),
            "id_number": data.get("idNumber"),
            "date_of_birth": data.get("dateOfBirth"),
            "occupation": data.get("occupation"),
            "employer": data.get("employer"),
            "annual_income": data.get("annualIncome"),
            "mobile_number": data.get("mobileNumber"),
            "email_address": data.get("emailAddress"),
            "primary_address": data.get("primaryAddress"),
            "risk_profile": data.get("riskProfile", "MODERATE"),
            "risk_score": data.get("riskScore", 50)
        }
        client = ClientRepository.create({k: v for k, v in mapped.items() if v is not None})
        return ClientService.to_detail(client)
