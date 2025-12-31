# Exhibition Management System - Docker Makefile
# Simplified commands for Docker operations

# Docker Compose variables
DOCKER_COMPOSE = docker compose -f infra/docker/docker-compose.yml --env-file infra/docker/.env

.PHONY: help up down build rebuild restart logs clean status ps

# Default target - show help
help:
	@echo "==================================================================="
	@echo "  Exhibition Management System - Docker Commands"
	@echo "==================================================================="
	@echo ""
	@echo "Available commands:"
	@echo ""
	@echo "  make up              Start all containers in detached mode"
	@echo "  make down            Stop and remove all containers"
	@echo "  make build           Rebuild all Docker images"
	@echo "  make rebuild         Rebuild and restart all containers"
	@echo "  make restart         Restart all containers"
	@echo "  make logs            View logs from all containers (follow mode)"
	@echo "  make logs-backend    View backend logs only"
	@echo "  make logs-frontend   View frontend logs only"
	@echo "  make logs-db         View database logs only"
	@echo "  make status          Show status of all containers"
	@echo "  make ps              List all containers (alias for status)"
	@echo ""
	@echo "  make shell-backend   Open shell in backend container"
	@echo "  make shell-frontend  Open shell in frontend container"
	@echo "  make shell-db        Open MySQL shell in database"
	@echo ""
	@echo "  make clean           Stop containers and remove volumes (DESTRUCTIVE)"
	@echo "  make clean-build     Remove all images and rebuild from scratch"
	@echo ""
	@echo "==================================================================="

# Start all containers
up:
	@echo "Starting all containers..."
	$(DOCKER_COMPOSE) up -d
	@echo "✓ Containers started successfully!"
	@echo "  - Frontend: http://localhost:5173"
	@echo "  - Backend:  http://localhost:3001"
	@echo "  - phpMyAdmin: http://localhost:8080"

# Stop all containers
down:
	@echo "Stopping all containers..."
	$(DOCKER_COMPOSE) down
	@echo "✓ Containers stopped successfully!"

# Build all images
build:
	@echo "Building all Docker images..."
	$(DOCKER_COMPOSE) build
	@echo "✓ Images built successfully!"

# Rebuild and restart
rebuild: down build up

# Restart all containers
restart:
	@echo "Restarting all containers..."
	$(DOCKER_COMPOSE) restart
	@echo "✓ Containers restarted successfully!"

# View all logs
logs:
	$(DOCKER_COMPOSE) logs -f

# View backend logs
logs-backend:
	$(DOCKER_COMPOSE) logs -f backend

# View frontend logs
logs-frontend:
	$(DOCKER_COMPOSE) logs -f frontend

# View database logs
logs-db:
	$(DOCKER_COMPOSE) logs -f db

# Show container status
status:
	$(DOCKER_COMPOSE) ps

# Alias for status
ps: status

# Open shell in backend container
shell-backend:
	@echo "Opening shell in backend container..."
	docker exec -it ems-backend sh

# Open shell in frontend container
shell-frontend:
	@echo "Opening shell in frontend container..."
	docker exec -it ems-frontend sh

# Open MySQL shell
shell-db:
	@echo "Opening MySQL shell..."
	@echo "Note: You'll be prompted for the password"
	docker exec -it ems-mysql mysql -uappuser -p exhibition_db

# Clean everything (DESTRUCTIVE - removes volumes)
clean:
	@echo "⚠️  WARNING: This will remove all containers and volumes!"
	@echo "⚠️  All database data will be lost!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "Cleaning up..."; \
		$(DOCKER_COMPOSE) down -v; \
		echo "✓ Cleanup complete!"; \
	else \
		echo "Cancelled."; \
	fi

# Clean and rebuild everything from scratch
clean-build:
	@echo "⚠️  WARNING: This will remove all containers, volumes, and images!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "Cleaning up..."; \
		$(DOCKER_COMPOSE) down -v --rmi all; \
		echo "Rebuilding..."; \
		$(DOCKER_COMPOSE) build --no-cache; \
		echo "✓ Clean build complete!"; \
	else \
		echo "Cancelled."; \
	fi
