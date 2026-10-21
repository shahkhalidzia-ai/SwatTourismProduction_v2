.PHONY: reset-empty seed-demo create-user test run-backend run-frontend run
SHELL := cmd.exe

reset-empty:
	@cd backend && python -m scripts.reset_empty

reset-empty-force:
	@cd backend && python -m scripts.reset_empty --force

seed-demo:
	@cd backend && python -m scripts.seed_demo_data

create-user:
	@cd backend && python -m scripts.create_user --email "$(EMAIL)" --password "$(PASSWORD)" --role "$(ROLE)" --name "$(NAME)" --dept "$(DEPT)" --title "$(TITLE)"

test:
	@cd backend && pytest
	@cd frontend && npm test -- --run

run-backend:
	@cd backend && uvicorn app.main:app --port 8090 --host 0.0.0.0 --reload

run-frontend:
	@cd frontend && npm run dev -- --port 5180 --host
