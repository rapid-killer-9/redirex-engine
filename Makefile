.PHONY: setup start stop clean

setup:
	cp .env.example .env
	docker-compose up -d
	cd backend && npm install
	cd frontend && npm install

start:
	docker-compose up -d
	npm run dev --prefix backend & npm run dev --prefix frontend

stop:
	docker-compose down

clean:
	docker-compose down -v
	rm -rf backend/node_modules frontend/node_modules