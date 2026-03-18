# Exhibition Management System - Docker Makefile
# Simplified commands for Docker operations

# Docker Compose variables
DOCKER_COMPOSE = docker compose -f infra/docker/docker-compose.yml --env-file infra/docker/.env
DOCKER_COMPOSE_PROD = docker compose -f infra/docker/docker-compose.prod.yml --env-file infra/docker/.env.production

.PHONY: help up down build rebuild rebuild-clean restart logs clean status ps backup-uploads list-uploads
.PHONY: prod-build prod-up prod-down prod-rebuild prod-logs prod-status prod-backup

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
	@echo "  make rebuild-clean   Rebuild with fresh DB (removes db volume)"
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
	@echo "  make backup-uploads  Backup uploaded files to host"
	@echo "  make list-uploads    List all uploaded files"
	@echo ""
	@echo "  make clean           Stop containers and remove volumes (DESTRUCTIVE)"
	@echo "  make clean-build     Remove all images and rebuild from scratch"
	@echo ""
	@echo "--- Production ---"
	@echo ""
	@echo "  make prod-build      Build production Docker images"
	@echo "  make prod-up         Start production containers"
	@echo "  make prod-down       Stop production containers"
	@echo "  make prod-rebuild    Rebuild and restart production containers"
	@echo "  make prod-logs       View production logs"
	@echo "  make prod-status     Show production container status"
	@echo "  make prod-backup     Backup production database and uploads"
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

# Rebuild with fresh DB (removes db volume so initdb.sql re-runs)
rebuild-clean:
	@echo "Stopping containers and removing DB volume..."
	$(DOCKER_COMPOSE) down -v
	@echo "Building images..."
	$(DOCKER_COMPOSE) build
	@echo "Starting containers with fresh DB..."
	$(DOCKER_COMPOSE) up -d
	@echo "✓ Rebuild complete with fresh database!"

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

# Backup uploads to host
backup-uploads:
	@echo "Backing up uploads..."
	@mkdir -p backups
	@docker cp ems-backend:/app/uploads backups/uploads_$(shell date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Note: No uploads directory found in container (this is normal for fresh installs)"
	@echo "✓ Backup complete! (Check backups/ directory)"

# List uploaded files
list-uploads:
	@echo "Uploaded files:"
	@docker exec ems-backend find /app/uploads -type f 2>/dev/null || echo "Note: No uploads found or container not running"

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

# ===================================================================
# Production Targets
# ===================================================================

# Build production images
prod-build:
	@echo "Building production images..."
	$(DOCKER_COMPOSE_PROD) build
	@echo "✓ Production images built!"

# Start production containers
prod-up:
	@echo "Starting production containers..."
	$(DOCKER_COMPOSE_PROD) up -d
	@echo "✓ Production containers started!"
	@echo "  Application: http://localhost (port 80)"

# Stop production containers
prod-down:
	@echo "Stopping production containers..."
	$(DOCKER_COMPOSE_PROD) down
	@echo "✓ Production containers stopped!"

# Rebuild and restart production
prod-rebuild: prod-down prod-build prod-up

# View production logs
prod-logs:
	$(DOCKER_COMPOSE_PROD) logs -f

# Production container status
prod-status:
	$(DOCKER_COMPOSE_PROD) ps

# Backup production database and uploads
prod-backup:
	@echo "Creating production backup..."
	@mkdir -p backups
	@echo "Backing up database..."
	@docker exec ems-mysql mysqldump -u$$(grep '^MYSQL_USER=' infra/docker/.env.production | cut -d= -f2) -p$$(grep '^MYSQL_PASSWORD=' infra/docker/.env.production | cut -d= -f2) $$(grep '^MYSQL_DATABASE=' infra/docker/.env.production | cut -d= -f2) > backups/db_$$(date +%Y%m%d_%H%M%S).sql 2>/dev/null
	@echo "Backing up uploads..."
	@docker cp ems-backend:/app/apps/backend/uploads backups/uploads_$$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Note: No uploads found"
	@echo "✓ Backup complete! (Check backups/ directory)"
