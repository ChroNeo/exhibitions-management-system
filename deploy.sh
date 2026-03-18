#!/bin/bash
set -e

# ============================================
# Exhibition Management System - Production Deployment Script
# ============================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh setup    # First-time server setup (install Docker)
#   ./deploy.sh deploy   # Build and start production containers
#   ./deploy.sh update   # Pull latest code and redeploy
#   ./deploy.sh stop     # Stop all containers
#   ./deploy.sh status   # Show container status
#   ./deploy.sh logs     # View logs
#   ./deploy.sh backup   # Backup database and uploads
# ============================================

COMPOSE_FILE="infra/docker/docker-compose.prod.yml"
ENV_FILE="infra/docker/.env.production"
BACKUP_DIR="backups"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---- Check prerequisites ----
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Production environment file not found: $ENV_FILE"
        log_info "Copy the example and configure it:"
        echo "  cp infra/docker/.env.production.example infra/docker/.env.production"
        echo "  nano infra/docker/.env.production"
        exit 1
    fi

    # Check for placeholder values
    if grep -q "CHANGE_ME\|YOUR_SERVER_IP" "$ENV_FILE"; then
        log_warn "Found placeholder values in $ENV_FILE"
        log_warn "Please update all CHANGE_ME and YOUR_SERVER_IP values before deploying."
        read -p "Continue anyway? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# ---- Install Docker on Ubuntu/Debian ----
setup_docker() {
    log_info "Installing Docker on Ubuntu/Debian..."

    # Update system
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg

    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
    fi

    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add current user to docker group
    sudo usermod -aG docker $USER

    # Enable Docker to start on boot
    sudo systemctl enable docker
    sudo systemctl start docker

    log_info "Docker installed successfully!"
    log_info "Please log out and log back in for group changes to take effect."
    log_info "Then run: ./deploy.sh deploy"
}

# ---- Setup firewall ----
setup_firewall() {
    log_info "Configuring firewall (ufw)..."

    sudo ufw allow OpenSSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS (for future use)

    sudo ufw --force enable
    log_info "Firewall configured: SSH, HTTP, HTTPS allowed."
}

# ---- First-time setup ----
cmd_setup() {
    log_info "=== First-time Server Setup ==="

    setup_docker

    read -p "Configure firewall (ufw)? [Y/n] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        setup_firewall
    fi

    # Create env file from example if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        cp infra/docker/.env.production.example "$ENV_FILE"
        log_info "Created $ENV_FILE from example."
        log_warn "IMPORTANT: Edit $ENV_FILE with your production values before deploying!"
        echo "  nano $ENV_FILE"
    fi

    log_info "=== Setup complete! ==="
    log_info "Next steps:"
    echo "  1. Log out and log back in (for Docker group)"
    echo "  2. Edit $ENV_FILE with your production values"
    echo "  3. Run: ./deploy.sh deploy"
}

# ---- Deploy ----
cmd_deploy() {
    log_info "=== Deploying Exhibition Management System ==="
    check_env

    log_info "Building production images..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

    log_info "Starting containers..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log_info "Waiting for services to be healthy..."
    sleep 10

    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

    log_info "=== Deployment complete! ==="
    log_info "Application should be accessible at your server's IP on port 80."
}

# ---- Update (pull + redeploy) ----
cmd_update() {
    log_info "=== Updating Exhibition Management System ==="
    check_env

    log_info "Pulling latest code..."
    git pull

    log_info "Rebuilding images..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

    log_info "Restarting containers..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log_info "=== Update complete! ==="
}

# ---- Stop ----
cmd_stop() {
    log_info "Stopping all containers..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    log_info "Containers stopped."
}

# ---- Status ----
cmd_status() {
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

# ---- Logs ----
cmd_logs() {
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "${2:-}"
}

# ---- Backup ----
cmd_backup() {
    log_info "=== Creating Backup ==="

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    mkdir -p "$BACKUP_DIR"

    # Backup database
    log_info "Backing up database..."
    docker exec ems-mysql mysqldump \
        -u"$(grep MYSQL_USER "$ENV_FILE" | head -1 | cut -d= -f2)" \
        -p"$(grep MYSQL_PASSWORD "$ENV_FILE" | head -1 | cut -d= -f2)" \
        "$(grep MYSQL_DATABASE "$ENV_FILE" | head -1 | cut -d= -f2)" \
        > "$BACKUP_DIR/db_${TIMESTAMP}.sql" 2>/dev/null

    log_info "Database backup: $BACKUP_DIR/db_${TIMESTAMP}.sql"

    # Backup uploads
    log_info "Backing up uploads..."
    docker cp ems-backend:/app/apps/backend/uploads "$BACKUP_DIR/uploads_${TIMESTAMP}" 2>/dev/null || \
        log_warn "No uploads found (this is normal for fresh installs)"

    log_info "=== Backup complete! ==="
    ls -lh "$BACKUP_DIR/"
}

# ---- Restore database ----
cmd_restore() {
    if [ -z "$2" ]; then
        log_error "Usage: ./deploy.sh restore <backup_file.sql>"
        exit 1
    fi

    if [ ! -f "$2" ]; then
        log_error "Backup file not found: $2"
        exit 1
    fi

    log_warn "This will overwrite the current database!"
    read -p "Are you sure? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi

    log_info "Restoring database from $2..."
    docker exec -i ems-mysql mysql \
        -u"$(grep MYSQL_USER "$ENV_FILE" | head -1 | cut -d= -f2)" \
        -p"$(grep MYSQL_PASSWORD "$ENV_FILE" | head -1 | cut -d= -f2)" \
        "$(grep MYSQL_DATABASE "$ENV_FILE" | head -1 | cut -d= -f2)" \
        < "$2"

    log_info "Database restored successfully!"
}

# ---- Main ----
case "${1:-}" in
    setup)   cmd_setup ;;
    deploy)  cmd_deploy ;;
    update)  cmd_update ;;
    stop)    cmd_stop ;;
    status)  cmd_status ;;
    logs)    cmd_logs "$@" ;;
    backup)  cmd_backup ;;
    restore) cmd_restore "$@" ;;
    *)
        echo "============================================"
        echo "  EMS Production Deployment Script"
        echo "============================================"
        echo ""
        echo "Usage: ./deploy.sh <command>"
        echo ""
        echo "Commands:"
        echo "  setup    - First-time server setup (install Docker, firewall)"
        echo "  deploy   - Build images and start production containers"
        echo "  update   - Pull latest code and redeploy"
        echo "  stop     - Stop all containers"
        echo "  status   - Show container status"
        echo "  logs     - View logs (optional: logs backend|frontend|db|nginx)"
        echo "  backup   - Backup database and uploads"
        echo "  restore  - Restore database from backup file"
        echo ""
        ;;
esac
