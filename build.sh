#!/bin/bash

##############################################################################
# ManifestExpo Build Script
#
# Usage:
#   ./build.sh           # Full rebuild (default)
#   ./build.sh --quick   # Git pull + restart only (skip npm install & build)
##############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
WEB_DIR="$PROJECT_DIR/apps/web"
LOG_FILE="$PROJECT_DIR/build.log"

# Port range Next.js might squatter on (dev bumps 3000 → 3001 → ...)
NEXTJS_PORT_START=3000
NEXTJS_PORT_END=3009

# The target port for the production server (matches ecosystem.config.js + package.json)
TARGET_PORT=3001

# Deployment mode
MODE="full"
if [[ "${1:-}" == "--quick" || "${1:-}" == "-q" ]]; then
    MODE="quick"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC}  $1" | tee -a "$LOG_FILE"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}    $1" | tee -a "$LOG_FILE"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1" | tee -a "$LOG_FILE"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"; }
print_header(){ echo "" | tee -a "$LOG_FILE"; echo "===========================================================================" | tee -a "$LOG_FILE"; echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"; echo "===========================================================================" | tee -a "$LOG_FILE"; echo "" | tee -a "$LOG_FILE"; }

echo "" > "$LOG_FILE"
echo "Build started at: $(date)" >> "$LOG_FILE"

##############################################################################
# Step 1: Kill all Next.js processes across the entire port range
##############################################################################

kill_nextjs_ports() {
    print_header "Step 1: Clearing All Next.js Ports ($NEXTJS_PORT_START-$NEXTJS_PORT_END)"

    local killed=0

    # Kill by process name first (catches all next-server / next dev instances)
    local name_pids
    name_pids=$(pgrep -f "next-server\|next dev\|next start" 2>/dev/null || true)
    if [ -n "$name_pids" ]; then
        log_info "Killing Next.js processes by name: $(echo $name_pids | tr '\n' ' ')"
        echo "$name_pids" | xargs kill -9 2>/dev/null || true
        killed=1
    fi

    # Then sweep every port in the range
    for port in $(seq $NEXTJS_PORT_START $NEXTJS_PORT_END); do
        local pids
        pids=$(lsof -ti:"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            local cmd
            cmd=$(ps -p "$(echo "$pids" | head -1)" -o comm= 2>/dev/null || echo "unknown")
            log_info "Port $port in use by '$cmd' (PID: $pids) — killing"
            echo "$pids" | xargs kill -9 2>/dev/null || true
            killed=1
        fi
    done

    [ "$killed" -eq 0 ] && log_ok "No stale Next.js processes found" || true

    # Give the OS a moment to release the ports
    sleep 2

    # Verify target port is now free
    if lsof -ti:"$TARGET_PORT" &>/dev/null; then
        log_error "Port $TARGET_PORT still occupied after cleanup!"
        lsof -i:"$TARGET_PORT"
        exit 1
    fi
    log_ok "Port $TARGET_PORT is free and ready"
}

##############################################################################
# Step 2: Git pull
##############################################################################

git_pull() {
    print_header "Step 2: Pulling Latest Code"

    cd "$PROJECT_DIR"
    log_info "Current branch: $(git branch --show-current)"

    # Stash any local changes so pull doesn't fail
    if ! git diff --quiet 2>/dev/null; then
        log_warn "Local changes detected — stashing"
        git stash push -m "build.sh auto-stash $(date +%Y%m%d-%H%M%S)" 2>&1 | tee -a "$LOG_FILE"
    fi

    git fetch origin 2>&1 | tee -a "$LOG_FILE"
    git pull origin "$(git branch --show-current)" 2>&1 | tee -a "$LOG_FILE"
    log_ok "Latest commit: $(git log -1 --oneline)"
}

##############################################################################
# Step 3: Install dependencies
##############################################################################

install_deps() {
    print_header "Step 3: Installing Dependencies"

    cd "$PROJECT_DIR"
    log_info "Installing root workspace dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
    log_ok "Dependencies installed"
}

##############################################################################
# Step 4: Build web app
##############################################################################

build_web() {
    print_header "Step 4: Building Web App (apps/web)"

    cd "$WEB_DIR"
    log_info "Running next build..."
    npm run build 2>&1 | tee -a "$LOG_FILE"
    log_ok "Web app built successfully"
}

##############################################################################
# Step 5: Start server
##############################################################################

start_server() {
    print_header "Step 5: Starting Server"

    # Prefer PM2 if available
    if command -v pm2 &>/dev/null; then
        log_info "Starting via PM2 (ecosystem.config.js)..."
        cd "$PROJECT_DIR"

        # Stop existing PM2 app if running
        pm2 stop manifest-web 2>/dev/null || true
        pm2 delete manifest-web 2>/dev/null || true

        pm2 start ecosystem.config.js 2>&1 | tee -a "$LOG_FILE"
        pm2 save 2>/dev/null || true
        log_ok "PM2 process started"

        sleep 4
        pm2 status manifest-web
    else
        # Fallback: bare nohup
        log_warn "PM2 not found — starting with nohup"
        cd "$WEB_DIR"
        nohup npm run start > "$PROJECT_DIR/web.log" 2>&1 &
        local pid=$!
        log_info "Web server PID: $pid"
        sleep 4
        if ps -p "$pid" > /dev/null 2>&1; then
            log_ok "Web server running (PID $pid)"
        else
            log_error "Web server failed to start — check $PROJECT_DIR/web.log"
            tail -30 "$PROJECT_DIR/web.log"
            exit 1
        fi
    fi
}

##############################################################################
# Step 6: Health check
##############################################################################

health_check() {
    print_header "Step 6: Health Check"

    log_info "Waiting for server to be ready on port $TARGET_PORT..."
    local attempts=0
    local max=12  # 12 × 5 s = 60 s timeout

    while [ $attempts -lt $max ]; do
        if curl -sf "http://localhost:$TARGET_PORT" > /dev/null 2>&1; then
            log_ok "Server is responding on http://localhost:$TARGET_PORT"
            return 0
        fi
        attempts=$((attempts + 1))
        log_info "Attempt $attempts/$max — not ready yet, waiting 5 s..."
        sleep 5
    done

    log_error "Server did not respond within 60 s on port $TARGET_PORT"
    if command -v pm2 &>/dev/null; then
        pm2 logs manifest-web --lines 30 --nostream
    else
        tail -30 "$PROJECT_DIR/web.log" 2>/dev/null || true
    fi
    exit 1
}

##############################################################################
# Main
##############################################################################

echo ""
echo "==========================================================================="
if [ "$MODE" = "quick" ]; then
    echo -e "${YELLOW}QUICK MODE${NC} — git pull + port cleanup + restart (skip install & build)"
else
    echo -e "${BLUE}FULL BUILD MODE${NC} — git pull + install + build + restart"
fi
echo "==========================================================================="
echo ""

kill_nextjs_ports
git_pull

if [ "$MODE" = "full" ]; then
    install_deps
    build_web
fi

start_server
health_check

echo ""
echo "==========================================================================="
echo -e "${GREEN}BUILD COMPLETE${NC}"
echo "==========================================================================="
echo "  Web app:  http://localhost:$TARGET_PORT"
echo "  Log file: $LOG_FILE"
if command -v pm2 &>/dev/null; then
    echo "  PM2 logs: pm2 logs manifest-web"
else
    echo "  App logs: $PROJECT_DIR/web.log"
fi
echo ""
