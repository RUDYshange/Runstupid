# Royal Square CRM

A modern, full-stack wealth management & advisory CRM built with **Python 3.12 + SQLite** (backend) and **React 18 + TypeScript** (frontend).

---

## Architecture

```
royal-square-crm/
├── royal-square-crm-python/      # Python 3.12 + FastAPI + SQLite (Layered Architecture)
│   ├── app/
│   │   ├── routers/              # [Layer 1] FastAPI Presentation / Endpoints
│   │   ├── services/             # [Layer 2] Business Logic, Math & POPIA Masking
│   │   ├── rules/                # [Rules Engine] Pluggable Compliance & Review Rules
│   │   ├── repositories/         # [Layer 3] SQLAlchemy Data Access Layer
│   │   ├── models/               # [Layer 4] SQLAlchemy ORM Database Entities
│   │   ├── schemas/              # Pydantic DTOs & Validation
│   │   ├── database.py           # SQLite connection (WAL mode)
│   │   ├── seed.py               # Initial wealth management seed data
│   │   └── main.py               # FastAPI entrypoint with CORS
│   └── requirements.txt
│
└── royal-square-crm-react/       # React 18 + TypeScript + Vite (Hardened Frontend)
    ├── src/
    │   ├── components/
    │   │   ├── forms/            # DynamicForm, MaskedIdInput, CurrencyInput, Honeypot
    │   │   └── ui/               # Design system primitives
    │   ├── security/             # POPIA RSA ID Luhn check, XSS sanitizer, CSRF locks
    │   ├── schemas/              # Zod validation & Server-Driven UI types
    │   ├── services/             # API client with CSRF and idempotency keys
    │   └── views/                # Portfolio, Secure Form, SDUI Engine, Claims, Reminders
    └── package.json
```

---

## Quickstart with Makefile

To run the entire app locally with a single command:

```bash
make run              # Runs both Django (:8000) and React (:5173) locally
```

*(If it is your first time running, `make run` automatically creates virtual environments, installs dependencies, runs migrations, and seeds sample data.)*

### Other Useful Make Commands:

```bash
make help             # View all available make commands
make run-backend      # Run only the Django REST API on http://localhost:8000
make run-frontend     # Run only the React Vite frontend on http://localhost:5173
make migrate          # Run database migrations
make seed             # Re-seed database with sample records
make check            # Run Django security checks and React build verification
make clean            # Remove build caches and pycache
```

---

## Manual Execution (Without Make)
```bash
cd royal-square-crm-python
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python -m app.seed     # Seeds SQLite database (royalsquare.db)
./venv/bin/uvicorn app.main:app --port 8000
```
- API Health: `http://localhost:8000/api/health`
- Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Start the React Frontend
```bash
cd royal-square-crm-react
npm install
npm run dev
```
- Web Application: `http://localhost:5173` (proxies `/api` directly to port 8000)

---

## Security & Compliance Highlights
- **POPIA Protection**: Field-level masking on RSA ID numbers (`900101 **** ***`) with real-time Luhn checksum validation.
- **Server-Driven UI (SDUI)**: Forms render dynamically based on JSON schemas emitted by the Python backend without hardcoded frontend form code.
- **Anti-Bot & Anti-Tampering**: Invisible honeypot traps and in-flight submission idempotency locks.
- **Financial Math**: Scale-2 decimal compliance for asset/liability grouping, surplus calculations, and debt-to-asset ratios.