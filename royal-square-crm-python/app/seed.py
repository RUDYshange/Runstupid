"""Database seed script with realistic South African wealth management CRM data."""
from datetime import date, timedelta
from decimal import Decimal
from app.database import SessionLocal, init_db
from app.models.client import Client
from app.models.ledger import LedgerEntry
from app.models.goal import Goal
from app.models.policy import Policy
from app.models.compliance import ComplianceDocument
from app.models.claim import Claim, ClaimLogEntry, ClaimSceneItem

def seed():
    init_db()
    db = SessionLocal()

    # Don't re-seed if clients already exist
    if db.query(Client).first():
        print("Database already contains records. Skipping seed.")
        db.close()
        return

    print("Seeding database with initial CRM records...")

    # 1. Client: Sipho Dlamini (High Net Worth Executive)
    c1 = Client(
        reference="CLI-1024",
        title="Dr",
        first_name="Sipho",
        second_name="Bheki",
        surname="Dlamini",
        id_number="8403125289081",
        date_of_birth=date(1984, 3, 12),
        licence_expiry=date.today() + timedelta(days=25), # Expiring soon!
        next_review_date=date.today() + timedelta(days=10), # Due soon!
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
    db.add(c1)
    db.flush()

    # Ledger for Sipho
    db.add_all([
        LedgerEntry(client_id=c1.id, category="ASSET", label="Primary Residence (Sandhurst)", amount=Decimal("6500000.00")),
        LedgerEntry(client_id=c1.id, category="ASSET", label="Allan Gray Balanced Fund", amount=Decimal("3200000.00")),
        LedgerEntry(client_id=c1.id, category="ASSET", label="Coronation Top 20 Equity", amount=Decimal("1850000.00")),
        LedgerEntry(client_id=c1.id, category="LIABILITY", label="Standard Bank Home Loan", amount=Decimal("2100000.00"), creditor="Standard Bank", interest_rate=Decimal("11.25")),
        LedgerEntry(client_id=c1.id, category="LIABILITY", label="WesBank Vehicle Finance", amount=Decimal("450000.00"), creditor="WesBank", interest_rate=Decimal("12.50")),
        LedgerEntry(client_id=c1.id, category="INCOME", label="Monthly Net Remuneration", amount=Decimal("135000.00")),
        LedgerEntry(client_id=c1.id, category="EXPENSE", label="Bond & Vehicle Repayments", amount=Decimal("38000.00")),
        LedgerEntry(client_id=c1.id, category="EXPENSE", label="Living & Schooling Expenses", amount=Decimal("45000.00"))
    ])

    # Goals for Sipho
    db.add_all([
        Goal(client_id=c1.id, name="Early Retirement at 55", kind="RETIREMENT", target_amount=Decimal("25000000.00"), current_amount=Decimal("5050000.00"), monthly_contribution=Decimal("30000.00"), start_date=date(2018, 5, 14), target_date=date(2039, 3, 12), vehicle="Retirement Annuity"),
        Goal(client_id=c1.id, name="Children University Overseas Fund", kind="EDUCATION", target_amount=Decimal("3000000.00"), current_amount=Decimal("1200000.00"), monthly_contribution=Decimal("15000.00"), start_date=date(2020, 1, 1), target_date=date(2030, 1, 1), vehicle="Unit Trust")
    ])

    # Policies for Sipho
    db.add_all([
        Policy(client_id=c1.id, provider="Discovery Life", product_type="Life & Severe Illness Cover", policy_number="DIS-88391", sum_assured=Decimal("10000000.00"), monthly_premium=Decimal("3450.00"), renewal_date=date.today() + timedelta(days=120)),
        Policy(client_id=c1.id, provider="Santam", product_type="Comprehensive Executive Personal Lines", policy_number="SAN-40192", sum_assured=Decimal("8000000.00"), monthly_premium=Decimal("2800.00"), renewal_date=date.today() + timedelta(days=90))
    ])

    # Compliance for Sipho (Missing Consent renewal)
    db.add_all([
        ComplianceDocument(client_id=c1.id, type="ID", signed_on=date(2022, 1, 15), storage_key="docs/c1/id.pdf"),
        ComplianceDocument(client_id=c1.id, type="PROOF_OF_RESIDENCE", signed_on=date.today() - timedelta(days=40), storage_key="docs/c1/utility.pdf"),
        ComplianceDocument(client_id=c1.id, type="CONSENT", signed_on=date.today() - timedelta(days=380), storage_key="docs/c1/consent.pdf") # Overdue!
    ])

    # 2. Client: Ansie Van Der Merwe (Agricultural Business Owner)
    c2 = Client(
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
    db.add(c2)
    db.flush()

    db.add_all([
        LedgerEntry(client_id=c2.id, category="ASSET", label="Stellenbosch Wine & Fruit Holding", amount=Decimal("14000000.00")),
        LedgerEntry(client_id=c2.id, category="ASSET", label="Sanlam Fixed Return Endowment", amount=Decimal("4200000.00")),
        LedgerEntry(client_id=c2.id, category="LIABILITY", label="Land Bank Agro Facility", amount=Decimal("3100000.00"), creditor="Land Bank", interest_rate=Decimal("10.50")),
        LedgerEntry(client_id=c2.id, category="INCOME", label="Monthly Director Draw", amount=Decimal("110000.00")),
        LedgerEntry(client_id=c2.id, category="EXPENSE", label="Operational & Personal Living", amount=Decimal("52000.00"))
    ])

    # 3. An Active Claim for Sipho Dlamini
    claim1 = Claim(
        client_id=c1.id,
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
    db.add(claim1)
    db.flush()

    db.add_all([
        ClaimSceneItem(claim_id=claim1.id, item="PHOTOS"),
        ClaimSceneItem(claim_id=claim1.id, item="POLICE_REPORT"),
        ClaimSceneItem(claim_id=claim1.id, item="DAMAGE_ESTIMATE"),
        ClaimLogEntry(claim_id=claim1.id, text="Claim registered with Santam online broker portal."),
        ClaimLogEntry(claim_id=claim1.id, text="Assessor Eileen Botha appointed to inspect vehicle at Renew-It Sandton."),
        ClaimLogEntry(claim_id=claim1.id, text="Stage advanced to ASSESSMENT.")
    ])

    db.commit()
    db.close()
    print("Seeding complete! 2 clients, balance sheets, goals, policies, and claims created.")

if __name__ == "__main__":
    seed()
