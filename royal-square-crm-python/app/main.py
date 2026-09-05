from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import clients, claims, reminders, ui

app = FastAPI(
    title="Royal Square CRM API",
    description="Layered Python + SQLite API with POPIA Compliance and Server-Driven Form Support",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(clients.router)
app.include_router(claims.router)
app.include_router(reminders.router)
app.include_router(ui.router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "Royal Square CRM Python API", "database": "SQLite"}
