import uuid
from django.db import models
from django.core.validators import RegexValidator

STAGE_CHOICES = [
    ("REGISTERED", "Registered"),
    ("DOCS_REQUESTED", "Docs Requested"),
    ("DOCS_RECEIVED", "Docs Received"),
    ("ASSESSOR_APPOINTED", "Assessor Appointed"),
    ("ASSESSMENT", "Assessment"),
    ("DECISION", "Decision"),
    ("OFFER", "Offer"),
    ("ACCEPTED", "Accepted"),
    ("PAID", "Paid"),
    ("CLOSED", "Closed"),
]
STAGES = [s[0] for s in STAGE_CHOICES]
SCENE_ITEMS = ["PHOTOS", "POLICE_REPORT", "WITNESS_DETAILS", "DAMAGE_ESTIMATE", "INVOICES"]

class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=16, unique=True, db_index=True)
    title = models.CharField(max_length=10)
    first_name = models.CharField(max_length=60)
    second_name = models.CharField(max_length=60, blank=True, null=True)
    surname = models.CharField(max_length=60)
    id_number = models.CharField(
        max_length=13,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^\d{13}$', 'ID must be 13 digits')]
    )
    date_of_birth = models.DateField(blank=True, null=True)
    licence_expiry = models.DateField(blank=True, null=True)
    wedding_anniversary = models.DateField(blank=True, null=True)
    next_review_date = models.DateField(blank=True, null=True)
    client_since = models.DateField(blank=True, null=True)
    occupation = models.CharField(max_length=80, blank=True, null=True)
    employer = models.CharField(max_length=80, blank=True, null=True)
    annual_income = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    mobile_number = models.CharField(max_length=20, blank=True, null=True)
    email_address = models.EmailField(max_length=120, blank=True, null=True)
    primary_address = models.CharField(max_length=255, blank=True, null=True)
    risk_profile = models.CharField(max_length=20, default="MODERATE")
    risk_score = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['surname', 'first_name']

    @property
    def full_name(self):
        return f"{self.first_name} {self.surname}"

    def __str__(self):
        return f"{self.reference} - {self.full_name}"

class LedgerEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='ledger_entries')
    category = models.CharField(max_length=30) # ASSET, LIABILITY, INCOME, EXPENSE
    label = models.CharField(max_length=120)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    creditor = models.CharField(max_length=80, blank=True, null=True)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return f"{self.category}: {self.label} ({self.amount})"

class Goal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='goals')
    name = models.CharField(max_length=120)
    kind = models.CharField(max_length=30) # RETIREMENT, EDUCATION, WEALTH
    target_amount = models.DecimalField(max_digits=15, decimal_places=2)
    current_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    monthly_contribution = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    start_date = models.DateField()
    target_date = models.DateField()
    vehicle = models.CharField(max_length=120, blank=True, null=True)

    def __str__(self):
        return self.name

class Policy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='policies')
    provider = models.CharField(max_length=80)
    product_type = models.CharField(max_length=60)
    policy_number = models.CharField(max_length=40)
    sum_assured = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    monthly_premium = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    renewal_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.provider} - {self.policy_number}"

class ComplianceDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='documents')
    type = models.CharField(max_length=40) # ID, PROOF_OF_RESIDENCE, CONSENT, ADVICE_RECORD
    signed_on = models.DateField()
    storage_key = models.CharField(max_length=300, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['client', 'type'], name='uq_client_compliance_type')
        ]

    def __str__(self):
        return f"{self.type} - {self.client.reference}"

class Claim(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='claims')
    reference = models.CharField(max_length=30, unique=True, db_index=True)
    insurer = models.CharField(max_length=80)
    policy_number = models.CharField(max_length=40, blank=True, null=True)
    insurer_claim_number = models.CharField(max_length=40, blank=True, null=True)
    claims_handler = models.CharField(max_length=120, blank=True, null=True)
    claim_type = models.CharField(max_length=60)
    incident_date = models.DateField()
    lodged_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default="REGISTERED")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def step_number(self):
        return STAGES.index(self.stage) + 1 if self.stage in STAGES else 1

    def total_steps(self):
        return len(STAGES)

    def is_closed(self):
        return self.stage == "CLOSED"

    def advance(self):
        if self.stage in STAGES and STAGES.index(self.stage) < len(STAGES) - 1:
            next_stage = STAGES[STAGES.index(self.stage) + 1]
            self.stage = next_stage
            self.save(update_fields=['stage', 'updated_at'])
            self.logs.create(text=f"Pipeline advanced to {self.stage}")

    def has_gathered(self, item):
        return self.scene_items.filter(item=item).exists()

    def __str__(self):
        return f"{self.reference} ({self.stage})"

class ClaimSceneItem(models.Model):
    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name='scene_items')
    item = models.CharField(max_length=40)

    class Meta:
        unique_together = ('claim', 'item')

    def __str__(self):
        return f"{self.claim.reference}: {self.item}"

class ClaimLogEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name='logs')
    text = models.CharField(max_length=500)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['recorded_at']

    def __str__(self):
        return f"{self.recorded_at.strftime('%Y-%m-%d %H:%M')}: {self.text}"

class ReminderDismissal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reminder_key = models.CharField(max_length=200, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.reminder_key
