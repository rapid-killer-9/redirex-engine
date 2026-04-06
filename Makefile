.PHONY: setup start stop status clean

# Initial installation and infrastructure spin-up
setup:
	cp backend/.env.example backend/.env || true
	docker compose up -d
	cd shared && npm install && npm run build
	cd backend && npm install
	cd frontend && npm install

# Start the entire distributed system
start:
	docker compose up -d
	@echo "🚀 Starting API, Worker, and Frontend..."
	npm run dev --prefix backend & \
	npm run worker --prefix backend & \
	npm run dev --prefix frontend

# Check the health of the containers
status:
	docker compose ps

# Stop all services
stop:
	docker compose down
	pkill -f "tsx" || true

# Deep clean of the environment
clean:
	docker compose down -v
	rm -rf shared/node_modules shared/dist
	rm -rf backend/node_modules frontend/node_modules
	rm -rf backend/dist
	