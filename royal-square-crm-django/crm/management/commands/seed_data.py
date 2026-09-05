from django.core.management.base import BaseCommand
from datetime import date, timedelta
from decimal import Decimal
from crm.models import (
    Client,
    LedgerEntry,
    Goal,
    Policy,
    ComplianceDocument,
    Claim,
    ClaimSceneItem,
    ClaimLogEntry
)

class Command(BaseCommand):
    help = 'Seeds initial realistic South African wealth management CRM records'

    def handle(self, *args, **kwargs):
        if Client.objects.exists():
            self.stdout.write(self.style.WARNING('Database already contains records. Skipping seed.'))
            return

        self.stdout.write('Seeding Django database with initial wealth management records...')

        # 1. Client: Sipho Dlamini
        c1 = Client.objects.create(
            reference="CLI-1024",
            title="Dr",
            first_name="Sipho",
            second_name="Bheki",
            surname="Dlamini",
            id_number="8403125289081",
            date_of_birth=date(1984, 3, 12),
            licence_expiry=date.today() + timedelta(days=25), # Expiring soon
            next_review_date=date.today() + timedelta(days=10), # Due soon
            client_since=date(2018, 5, 14),
            occupation="Chief Technology Officer",
            employer="Naspers Fintech",
            annual_income=Decimal("2400000.00"),
            mobile_number="+27 82 555 1234",
            email_address="sipho.dlamini@naspers.com",
            primary_address="14 Saxon Road, Sandhurst, Sandton, 2196",
            risk_profile="MODERATE",
            risk_score=68
        )

        LedgerEntry.objects.bulk_create([
            LedgerEntry(client=c1, category="ASSET", label="Primary Residence (Sandhurst)", amount=Decimal("6500000.00")),
            LedgerEntry(client=c1, category="ASSET", label="Allan Gray Balanced Fund", amount=Decimal("3200000.00")),
            LedgerEntry(client=c1, category="ASSET", label="Coronation Top 20 Equity", amount=Decimal("1850000.00")),
            LedgerEntry(client=c1, category="LIABILITY", label="Standard Bank Home Loan", amount=Decimal("2100000.00"), creditor="Standard Bank", interest_rate=Decimal("11.25")),
            LedgerEntry(client=c1, category="LIABILITY", label="WesBank Vehicle Finance", amount=Decimal("450000.00"), creditor="WesBank", interest_rate=Decimal("12.50")),
            LedgerEntry(client=c1, category="INCOME", label="Monthly Net Remuneration", amount=Decimal("135000.00")),
            LedgerEntry(client=c1, category="EXPENSE", label="Bond & Vehicle Repayments", amount=Decimal("38000.00")),
            LedgerEntry(client=c1, category="EXPENSE", label="Living & Schooling Expenses", amount=Decimal("45000.00"))
        ])

        Goal.objects.bulk_create([
            Goal(client=c1, name="Early Retirement at 55", kind="RETIREMENT", target_amount=Decimal("25000000.00"), current_amount=Decimal("5050000.00"), monthly_contribution=Decimal("30000.00"), start_date=date(2018, 5, 14), target_date=date(2039, 3, 12), vehicle="Retirement Annuity"),
            Goal(client=c1, name="Children University Overseas Fund", kind="EDUCATION", target_amount=Decimal("3000000.00"), current_amount=Decimal("1200000.00"), monthly_contribution=Decimal("15000.00"), start_date=date(2020, 1, 1), target_date=date(2030, 1, 1), vehicle="Unit Trust")
        ])

        Policy.objects.bulk_create([
            Policy(client=c1, provider="Discovery Life", product_type="Life & Severe Illness Cover", policy_number="DIS-88391", sum_assured=Decimal("10000000.00"), monthly_premium=Decimal("3450.00"), renewal_date=date.today() + timedelta(days=120)),
            Policy(client=c1, provider="Santam", product_type="Comprehensive Executive Personal Lines", policy_number="SAN-40192", sum_assured=Decimal("8000000.00"), monthly_premium=Decimal("2800.00"), renewal_date=date.today() + timedelta(days=90))
        ])

        ComplianceDocument.objects.bulk_create([
            ComplianceDocument(client=c1, type="ID", signed_on=date(2022, 1, 15), storage_key="docs/c1/id.pdf"),
            ComplianceDocument(client=c1, type="PROOF_OF_RESIDENCE", signed_on=date.today() - timedelta(days=40), storage_key="docs/c1/utility.pdf"),
            ComplianceDocument(client=c1, type="CONSENT", signed_on=date.today() - timedelta(days=380), storage_key="docs/c1/consent.pdf") # Overdue
        ])

        # 2. Client: Ansie Van Der Merwe
        c2 = Client.objects.create(
            reference="CLI-1025",
            title="Mrs",
            first_name="Ansie",
            second_name="Maria",
            surname="Van Der Merwe",
            id_number="7608190123087",
            date_of_birth=date(1976, 8, 19),
            licence_expiry=date.today() + timedelta(days=400),
            next_review_date=date.today() + timedelta(days=180),
            client_since=date(2015, 11, 3),
            occupation="Managing Director",
            employer="Boland Agribusiness Pty Ltd",
            annual_income=Decimal("1850000.00"),
            mobile_number="+27 83 902 4411",
            email_address="ansie@bolandagri.co.za",
            primary_address="De Rust Farm, R44, Stellenbosch, 7600",
            risk_profile="CONSERVATIVE",
            risk_score=42
        )

        LedgerEntry.objects.bulk_create([
            LedgerEntry(client=c2, category="ASSET", label="Stellenbosch Wine & Fruit Holding", amount=Decimal("14000000.00")),
            LedgerEntry(client=c2, category="ASSET", label="Sanlam Fixed Return Endowment", amount=Decimal("4200000.00")),
            LedgerEntry(client=c2, category="LIABILITY", label="Land Bank Agro Facility", amount=Decimal("3100000.00"), creditor="Land Bank", interest_rate=Decimal("10.50")),
            LedgerEntry(client=c2, category="INCOME", label="Monthly Director Draw", amount=Decimal("110000.00")),
            LedgerEntry(client=c2, category="EXPENSE", label="Operational & Personal Living", amount=Decimal("52000.00"))
        ])

        # 3. Claim for Sipho
        claim1 = Claim.objects.create(
            client=c1,
            reference="CLM-2048",
            insurer="Santam",
            policy_number="SAN-40192",
            insurer_claim_number="SAN-CLM-88129",
            claims_handler="Eileen Botha",
            claim_type="MOTOR_ACCIDENT",
            incident_date=date.today() - timedelta(days=8),
            lodged_date=date.today() - timedelta(days=6),
            description="Collision with stationary obstacle at garage exit. Front bumper and right sensor housing damaged.",
            stage="ASSESSMENT"
        )

        ClaimSceneItem.objects.bulk_create([
            ClaimSceneItem(claim=claim1, item="PHOTOS"),
            ClaimSceneItem(claim=claim1, item="POLICE_REPORT"),
            ClaimSceneItem(claim=claim1, item="DAMAGE_ESTIMATE"),
        ])

        ClaimLogEntry.objects.bulk_create([
            ClaimLogEntry(claim=claim1, text="Claim registered with Santam online broker portal."),
            ClaimLogEntry(claim=claim1, text="Assessor Eileen Botha appointed to inspect vehicle at Renew-It Sandton."),
            ClaimLogEntry(claim=claim1, text="Stage advanced to ASSESSMENT.")
        ])

        self.stdout.write(self.style.SUCCESS('Successfully seeded Django SQLite database!'))
