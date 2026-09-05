from typing import Dict, Any

class UIService:
    @staticmethod
    def get_client_form_schema() -> Dict[str, Any]:
        return {
            "formId": "client-onboarding",
            "title": "Client Onboarding & Mandate Record",
            "description": "POPIA-compliant client profile registration (Django Secure by Design)",
            "submitEndpoint": "/api/clients",
            "method": "POST",
            "security": {
                "csrfProtected": True,
                "enableHoneypot": True,
                "preventDoubleSubmit": True,
                "fieldMasking": ["idNumber", "annualIncome"]
            },
            "sections": [
                {
                    "id": "personal",
                    "title": "Personal Information",
                    "columns": 2,
                    "fields": [
                        {
                            "name": "title",
                            "label": "Title",
                            "type": "select",
                            "required": True,
                            "options": [
                                {"label": "Mr", "value": "Mr"},
                                {"label": "Mrs", "value": "Mrs"},
                                {"label": "Ms", "value": "Ms"},
                                {"label": "Dr", "value": "Dr"},
                                {"label": "Prof", "value": "Prof"}
                            ],
                            "defaultValue": "Mr"
                        },
                        {
                            "name": "firstName",
                            "label": "First Name",
                            "type": "text",
                            "required": True,
                            "placeholder": "e.g. Sipho",
                            "sanitize": True
                        },
                        {
                            "name": "secondName",
                            "label": "Second Name (Optional)",
                            "type": "text",
                            "required": False,
                            "placeholder": "e.g. Bheki",
                            "sanitize": True
                        },
                        {
                            "name": "surname",
                            "label": "Surname",
                            "type": "text",
                            "required": True,
                            "placeholder": "e.g. Dlamini",
                            "sanitize": True
                        },
                        {
                            "name": "idNumber",
                            "label": "RSA ID Number (POPIA Protected)",
                            "type": "masked_rsa_id",
                            "required": True,
                            "placeholder": "13-digit RSA ID",
                            "helpText": "Validated via Luhn algorithm. Masked on display."
                        },
                        {
                            "name": "dateOfBirth",
                            "label": "Date of Birth",
                            "type": "date",
                            "required": False
                        }
                    ]
                },
                {
                    "id": "contact_employment",
                    "title": "Contact & Wealth Details",
                    "columns": 2,
                    "fields": [
                        {
                            "name": "emailAddress",
                            "label": "Email Address",
                            "type": "email",
                            "required": True,
                            "placeholder": "sipho.dlamini@example.co.za",
                            "sanitize": True
                        },
                        {
                            "name": "mobileNumber",
                            "label": "Mobile Phone",
                            "type": "tel",
                            "required": True,
                            "placeholder": "+27 82 123 4567",
                            "sanitize": True
                        },
                        {
                            "name": "occupation",
                            "label": "Occupation",
                            "type": "text",
                            "required": False,
                            "placeholder": "e.g. Senior Architect"
                        },
                        {
                            "name": "employer",
                            "label": "Employer / Company",
                            "type": "text",
                            "required": False,
                            "placeholder": "e.g. Standard Bank"
                        },
                        {
                            "name": "annualIncome",
                            "label": "Gross Annual Income",
                            "type": "currency",
                            "currency": "ZAR",
                            "required": False,
                            "placeholder": "R 0.00"
                        },
                        {
                            "name": "riskProfile",
                            "label": "Mandate Risk Profile",
                            "type": "select",
                            "required": True,
                            "options": [
                                {"label": "Conservative", "value": "CONSERVATIVE"},
                                {"label": "Moderate", "value": "MODERATE"},
                                {"label": "Aggressive", "value": "AGGRESSIVE"}
                            ],
                            "defaultValue": "MODERATE"
                        },
                        {
                            "name": "primaryAddress",
                            "label": "Physical Address",
                            "type": "textarea",
                            "required": False,
                            "placeholder": "Street address, Suburb, City, Postal Code"
                        }
                    ]
                }
            ]
        }

    @staticmethod
    def get_claim_form_schema() -> Dict[str, Any]:
        return {
            "formId": "claim-registration",
            "title": "Lodge Insurance Claim",
            "description": "Register an incident under active client policy",
            "submitEndpoint": "/api/claims",
            "method": "POST",
            "security": {
                "csrfProtected": True,
                "enableHoneypot": True,
                "preventDoubleSubmit": True
            },
            "sections": [
                {
                    "id": "claim_details",
                    "title": "Incident Particulars",
                    "columns": 2,
                    "fields": [
                        {
                            "name": "clientId",
                            "label": "Client ID / Reference",
                            "type": "text",
                            "required": True,
                            "placeholder": "Client UUID or Reference"
                        },
                        {
                            "name": "insurer",
                            "label": "Underwriter / Insurer",
                            "type": "select",
                            "required": True,
                            "options": [
                                {"label": "Old Mutual Insure", "value": "Old Mutual Insure"},
                                {"label": "Santam", "value": "Santam"},
                                {"label": "Discovery Insure", "value": "Discovery Insure"},
                                {"label": "Hollard", "value": "Hollard"},
                                {"label": "OUTsurance", "value": "OUTsurance"}
                            ]
                        },
                        {
                            "name": "claimType",
                            "label": "Claim Category",
                            "type": "select",
                            "required": True,
                            "options": [
                                {"label": "Motor Vehicle Accident", "value": "MOTOR_ACCIDENT"},
                                {"label": "Building / Geyser Storm Damage", "value": "STORM_DAMAGE"},
                                {"label": "Theft / Burglary", "value": "THEFT"},
                                {"label": "All Risks / Personal Possessions", "value": "ALL_RISKS"}
                            ]
                        },
                        {
                            "name": "policyNumber",
                            "label": "Policy Number",
                            "type": "text",
                            "required": False,
                            "placeholder": "POL-99214"
                        },
                        {
                            "name": "incidentDate",
                            "label": "Date of Incident",
                            "type": "date",
                            "required": True
                        },
                        {
                            "name": "description",
                            "label": "Incident Narrative / Loss Summary",
                            "type": "textarea",
                            "required": True,
                            "placeholder": "Provide chronological detail of how loss or damage occurred..."
                        }
                    ]
                }
            ]
        }
