# ==============================================================================
# Royal Square CRM — Root Makefile
# ==============================================================================

.PHONY: help run start run-local run-backend run-frontend install install-backend install-frontend setup migrate seed dev dev-backend dev-frontend build check clean

PYTHON_DIR := royal-square-crm-django
REACT_DIR := royal-square-crm-react
VENV := $(PYTHON_DIR)/venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

help: ## Display this help message
	@echo "Royal Square CRM — Development & Management Commands"
	@echo "======================================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

run: ## Run the entire application locally (Django backend + React frontend)
	@echo "======================================================="
	@echo "  Starting Royal Square CRM Locally"
	@echo "======================================================="
	@if [ ! -d "$(VENV)" ]; then echo "==> First time setup: Installing backend..."; $(MAKE) install-backend; fi
	@if [ ! -d "$(REACT_DIR)/node_modules" ]; then echo "==> First time setup: Installing frontend..."; $(MAKE) install-frontend; fi
	@if [ ! -f "$(PYTHON_DIR)/royalsquare.sqlite3" ]; then echo "==> First time setup: Initializing database..."; $(MAKE) migrate; $(MAKE) seed; fi
	@echo ""
	@echo "  • React Web App:   \033[32mhttp://localhost:5173\033[0m"
	@echo "  • Django REST API: \033[32mhttp://localhost:8000/api/health\033[0m"
	@echo "  • Django Admin:    \033[32mhttp://localhost:8000/admin\033[0m"
	@echo ""
	@echo "==> Running servers... Press Ctrl+C to stop both."
	@trap 'kill 0' EXIT; \
	(cd $(PYTHON_DIR) && ./venv/bin/python manage.py runserver 127.0.0.1:8000) & \
	(cd $(REACT_DIR) && npm run dev -- --host 127.0.0.1 --port 5173) & \
	wait

start: run ## Alias for 'make run'

run-local: run ## Alias for 'make run'

run-backend: dev-backend ## Run only the Django backend locally

run-frontend: dev-frontend ## Run only the React frontend locally

dev: run ## Alias for 'make run'

dev-backend: ## Start Django development server on port 8000
	@echo "==> Starting Django REST API on http://127.0.0.1:8000..."
	@cd $(PYTHON_DIR) && ./venv/bin/python manage.py runserver 127.0.0.1:8000

dev-frontend: ## Start React Vite development server on port 5173
	@echo "==> Starting React Frontend on http://127.0.0.1:5173..."
	@cd $(REACT_DIR) && npm run dev -- --host 127.0.0.1 --port 5173

install: install-backend install-frontend ## Install all dependencies (Django & React)

install-backend: ## Setup Python virtual environment and install Django dependencies
	@echo "==> Setting up Django virtual environment and dependencies..."
	@cd $(PYTHON_DIR) && python3 -m venv venv && ./venv/bin/pip install --upgrade pip && ./venv/bin/pip install -r requirements.txt
	@if [ ! -f $(PYTHON_DIR)/.env ]; then cp $(PYTHON_DIR)/.env.example $(PYTHON_DIR)/.env && echo "Created $(PYTHON_DIR)/.env"; fi
	@echo "==> Backend installation complete."

install-frontend: ## Install React frontend npm dependencies
	@echo "==> Installing React frontend npm packages..."
	@cd $(REACT_DIR) && npm install
	@if [ ! -f $(REACT_DIR)/.env ]; then cp $(REACT_DIR)/.env.example $(REACT_DIR)/.env && echo "Created $(REACT_DIR)/.env"; fi
	@echo "==> Frontend installation complete."

migrate: ## Run Django database migrations
	@echo "==> Applying Django migrations..."
	@cd $(PYTHON_DIR) && ./venv/bin/python manage.py makemigrations crm
	@cd $(PYTHON_DIR) && ./venv/bin/python manage.py migrate

seed: ## Seed SQLite database with realistic South African CRM records
	@echo "==> Seeding database..."
	@cd $(PYTHON_DIR) && ./venv/bin/python manage.py seed_data

setup: install migrate seed ## Complete initial setup (install, migrate, seed)
	@echo "==> Full setup completed successfully!"

build: ## Build the React frontend production bundle
	@echo "==> Building React production bundle..."
	@cd $(REACT_DIR) && npm run build

check: ## Run security audit and system check on Django & React
	@echo "==> Running Django system check..."
	@cd $(PYTHON_DIR) && ./venv/bin/python manage.py check
	@echo "==> Running React typecheck and lint..."
	@cd $(REACT_DIR) && npm run build

clean: ## Clean build artifacts, temporary caches, and pycache
	@echo "==> Cleaning caches and artifacts..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@rm -rf $(REACT_DIR)/dist $(REACT_DIR)/.vite 2>/dev/null || true
	@echo "==> Clean complete."
