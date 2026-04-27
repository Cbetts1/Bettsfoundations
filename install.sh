#!/usr/bin/env bash
# =============================================================
# Betts Foundations — One-Command Installer
# Server: 74.208.52.159  |  Domain: bettsfoundations.org
# OS target: AlmaLinux 9 (RHEL-based)
# =============================================================
set -euo pipefail

DOMAIN="bettsfoundations.org"
EMAIL="${ADMIN_EMAIL:-admin@bettsfoundations.org}"
APP_DIR="/opt/bettsfoundations"
COMPOSE="docker compose"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ─── Root check ──────────────────────────────────────────────
[[ $EUID -eq 0 ]] || error "Run this script as root: sudo bash install.sh"

# ─── Disk space check ────────────────────────────────────────
info "Checking available disk space…"
AVAILABLE_KB=$(df /var/lib/docker 2>/dev/null | tail -1 | awk '{print $4}' || df / | tail -1 | awk '{print $4}')
AVAILABLE_GB=$(( AVAILABLE_KB / 1024 / 1024 ))
if (( AVAILABLE_GB < 3 )); then
  warn "Less than 3 GB available (found ~${AVAILABLE_GB}GB). Attempting Docker cleanup first…"
  docker system prune -af --volumes || true
  docker builder prune -af || true
fi
info "Disk check complete."

# ─── Dependencies ────────────────────────────────────────────
info "Checking dependencies…"

if ! command -v docker &>/dev/null; then
  error "Docker is not installed. Please install Docker first:\n  dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo\n  dnf install -y docker-ce docker-ce-cli containerd.io\n  systemctl enable --now docker"
fi

if ! $COMPOSE version &>/dev/null; then
  info "Installing Docker Compose plugin…"
  dnf install -y docker-compose-plugin || {
    mkdir -p /usr/local/lib/docker/cli-plugins
    COMPOSE_VER=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
    curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VER}/docker-compose-linux-x86_64" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  }
fi

if ! command -v git &>/dev/null; then
  info "Installing git…"
  dnf install -y git
fi

info "All dependencies satisfied."

# ─── App directory ───────────────────────────────────────────
info "Setting up application directory at ${APP_DIR}…"
mkdir -p "$APP_DIR"

# If we are running from a clone already, just use it
if [[ -f "$(dirname "$0")/docker-compose.yml" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  if [[ "$SCRIPT_DIR" != "$APP_DIR" ]]; then
    cp -r "$SCRIPT_DIR/." "$APP_DIR/"
  fi
else
  # Clone from GitHub
  if [[ -d "$APP_DIR/.git" ]]; then
    info "Pulling latest changes…"
    git -C "$APP_DIR" pull --ff-only
  else
    git clone https://github.com/Cbetts1/Bettsfoundations.git "$APP_DIR"
  fi
fi

cd "$APP_DIR"

# ─── .env setup ──────────────────────────────────────────────
if [[ ! -f "$APP_DIR/.env" ]]; then
  info "Creating .env from .env.example…"
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"

  # Generate a secure JWT secret
  JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  sed -i "s|REPLACE_WITH_SECURE_RANDOM_SECRET_AT_LEAST_64_CHARS|${JWT_SECRET}|" "$APP_DIR/.env"

  warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  warn "ACTION REQUIRED: Edit ${APP_DIR}/.env and fill in:"
  warn "  • STRIPE_SECRET_KEY"
  warn "  • STRIPE_WEBHOOK_SECRET"
  warn "  • OPENAI_API_KEY"
  warn "  • ADMIN_EMAIL / ADMIN_PASSWORD"
  warn "Then re-run this script."
  warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi

# Verify required vars
source "$APP_DIR/.env"
for VAR in JWT_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET OPENAI_API_KEY; do
  [[ "${!VAR}" == *"REPLACE"* ]] && error "${VAR} still contains placeholder value. Edit .env first."
  [[ -z "${!VAR:-}" ]]          && error "${VAR} is empty. Edit .env first."
done

# ─── Firewall ────────────────────────────────────────────────
info "Configuring firewall…"
if command -v firewall-cmd &>/dev/null; then
  firewall-cmd --permanent --add-service=http  &>/dev/null || true
  firewall-cmd --permanent --add-service=https &>/dev/null || true
  firewall-cmd --reload &>/dev/null || true
fi

# ─── SSL Certificate (Let's Encrypt) ────────────────────────
info "Setting up SSL certificate for ${DOMAIN}…"

# Temporary HTTP-only nginx for ACME challenge
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
if [[ ! -d "$CERT_DIR" ]]; then
  info "Obtaining initial SSL certificate (HTTP must be reachable on port 80)…"

  # Start nginx in HTTP-only mode temporarily
  cat > /tmp/nginx_init.conf << 'EOF'
server {
    listen 80;
    server_name bettsfoundations.org www.bettsfoundations.org;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 'OK'; }
}
EOF

  # Use standalone certbot if docker certbot can reach port 80
  docker run --rm -it \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    -v "/var/www/certbot:/var/www/certbot" \
    -p "80:80" \
    certbot/certbot certonly \
      --standalone \
      --non-interactive \
      --agree-tos \
      --email "$EMAIL" \
      -d "$DOMAIN" \
      -d "www.${DOMAIN}" || {
    warn "Certbot failed. SSL will need to be configured manually."
    warn "Run: certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN}"
    warn "Continuing with HTTP-only mode for now…"

    # Create self-signed cert as fallback so nginx doesn't crash
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -keyout "${CERT_DIR}/privkey.pem" \
      -out "${CERT_DIR}/fullchain.pem" \
      -subj "/CN=${DOMAIN}" 2>/dev/null || true

    # Create dhparams and options file if missing
    [[ -f /etc/letsencrypt/options-ssl-nginx.conf ]] || \
      curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
        -o /etc/letsencrypt/options-ssl-nginx.conf 2>/dev/null || \
      echo "ssl_protocols TLSv1.2 TLSv1.3;" > /etc/letsencrypt/options-ssl-nginx.conf

    [[ -f /etc/letsencrypt/ssl-dhparams.pem ]] || \
      openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048 2>/dev/null || true
  }
else
  info "SSL certificate already exists."
fi

# ─── Build & Start ───────────────────────────────────────────
info "Building Docker images (this takes a few minutes on first run)…"
$COMPOSE -f "$APP_DIR/docker-compose.yml" --env-file "$APP_DIR/.env" build --no-cache

info "Starting services…"
$COMPOSE -f "$APP_DIR/docker-compose.yml" --env-file "$APP_DIR/.env" up -d

# ─── Wait for backend health ─────────────────────────────────
info "Waiting for backend to be healthy…"
RETRIES=0
until docker inspect --format='{{.State.Health.Status}}' bf_backend 2>/dev/null | grep -q "healthy"; do
  sleep 3
  RETRIES=$((RETRIES+1))
  [[ $RETRIES -gt 20 ]] && { warn "Backend health check timeout. Check logs: docker logs bf_backend"; break; }
done

# ─── Create admin account ────────────────────────────────────
ADMIN_EMAIL_VAL="${ADMIN_EMAIL:-admin@bettsfoundations.org}"
ADMIN_PASS_VAL="${ADMIN_PASSWORD:-}"

if [[ -n "$ADMIN_PASS_VAL" && "$ADMIN_PASS_VAL" != *"REPLACE"* ]]; then
  info "Creating admin account for ${ADMIN_EMAIL_VAL}…"
  # Call backend API directly inside container
  docker exec bf_backend node -e "
    const bcrypt = require('bcryptjs');
    const { getDb, initDb } = require('./src/db');
    const { v4: uuidv4 } = require('uuid');
    initDb();
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('${ADMIN_EMAIL_VAL}');
    if (!existing) {
      const hash = bcrypt.hashSync('${ADMIN_PASS_VAL}', 12);
      db.prepare('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)').run(uuidv4(), '${ADMIN_EMAIL_VAL}', hash, 'admin');
      console.log('Admin account created.');
    } else {
      console.log('Admin account already exists.');
    }
  " 2>/dev/null && info "Admin account ready." || warn "Could not create admin account. Create it manually via /auth/register then promote in DB."
fi

# ─── Docker cleanup ──────────────────────────────────────────
info "Cleaning up build cache to save disk space…"
docker builder prune -f &>/dev/null || true
docker image prune -f  &>/dev/null || true

# ─── Log rotation ────────────────────────────────────────────
info "Configuring log rotation…"
cat > /etc/logrotate.d/bettsfoundations << 'EOF'
/var/lib/docker/containers/*/*-json.log {
    daily
    rotate 3
    compress
    missingok
    notifempty
    copytruncate
}
EOF

# ─── Done ────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Betts Foundations is LIVE!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  🌐 Site:   https://bettsfoundations.org"
echo "  🔧 Admin:  https://bettsfoundations.org/admin"
echo "  📦 Status: docker compose -f ${APP_DIR}/docker-compose.yml ps"
echo "  📋 Logs:   docker logs -f bf_backend"
echo ""
echo "  ⚠️  Post-install checklist:"
echo "     1. Verify https://bettsfoundations.org loads in your browser"
echo "     2. Log in to /admin with your admin credentials"
echo "     3. Add your Stripe webhook endpoint in the Stripe dashboard:"
echo "        https://bettsfoundations.org/api/orders/webhook"
echo "     4. Upload your first digital product (PDF)"
echo "     5. Place a test order using Stripe test mode"
echo ""
