.PHONY: backend frontend postgres all

backend:
	bash scripts/install_backend.sh

frontend:
	bash scripts/install_frontend.sh

postgres:
	bash scripts/setup_postgres.sh

all: backend frontend postgres
	@echo "Setup complete!"