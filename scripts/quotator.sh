#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$PROJECT_DIR/out"
DATA_DIR="$PROJECT_DIR/data"
LOG_DIR="$DATA_DIR/logs"

export DB_PATH="$DATA_DIR/quotator.db"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

# Check if Docker is available
has_docker() {
    command -v docker &> /dev/null && docker info &> /dev/null
}

# Check if compose is available
get_compose_cmd() {
    if docker compose version &> /dev/null 2>&1; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo ""
    fi
}

# Check if native binaries exist
has_native() {
    [ -f "$OUT_DIR/crawler" ] && [ -f "$OUT_DIR/quotator-api" ]
}

# Ensure directories exist
ensure_dirs() {
    mkdir -p "$DATA_DIR" "$LOG_DIR" "$OUT_DIR"
}

# PID file management
CRAWLER_PID="$DATA_DIR/crawler.pid"
API_PID="$DATA_DIR/api.pid"
FRONTEND_PID="$DATA_DIR/frontend.pid"

save_pid() {
    echo "$2" > "$1"
}

get_pid() {
    [ -f "$1" ] && cat "$1" 2>/dev/null
}

is_running() {
    local pid=$(get_pid "$1")
    [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# Native start functions
start_crawler_native() {
    if is_running "$CRAWLER_PID"; then
        print_warning "Crawler already running (PID: $(get_pid $CRAWLER_PID))"
        return 0
    fi

    print_status "Starting Crawler..."
    cd "$OUT_DIR"
    ./crawler > "$LOG_DIR/crawler.log" 2>&1 &
    save_pid "$CRAWLER_PID" $!
    sleep 1

    if is_running "$CRAWLER_PID"; then
        print_success "Crawler started (PID: $(get_pid $CRAWLER_PID))"
    else
        print_error "Crawler failed to start"
        return 1
    fi
}

start_api_native() {
    if is_running "$API_PID"; then
        print_warning "API already running (PID: $(get_pid $API_PID))"
        return 0
    fi

    print_status "Starting API..."
    cd "$OUT_DIR"
    RUST_LOG=info ./quotator-api > "$LOG_DIR/api.log" 2>&1 &
    save_pid "$API_PID" $!
    sleep 1

    if is_running "$API_PID"; then
        print_success "API started (PID: $(get_pid $API_PID))"
    else
        print_error "API failed to start"
        return 1
    fi
}

start_frontend_native() {
    if is_running "$FRONTEND_PID"; then
        print_warning "Frontend server already running (PID: $(get_pid $FRONTEND_PID))"
        return 0
    fi

    if [ -d "$OUT_DIR/frontend" ]; then
        print_status "Starting Frontend (static server)..."
        cd "$OUT_DIR/frontend"
        python3 -m http.server 3847 > "$LOG_DIR/frontend.log" 2>&1 &
        save_pid "$FRONTEND_PID" $!
        sleep 1

        if is_running "$FRONTEND_PID"; then
            print_success "Frontend started (PID: $(get_pid $FRONTEND_PID))"
        else
            print_error "Frontend failed to start"
            return 1
        fi
    else
        print_warning "Frontend not built, run: ./scripts/build.sh frontend"
    fi
}

stop_service() {
    local name=$1
    local pidfile=$2

    if is_running "$pidfile"; then
        local pid=$(get_pid "$pidfile")
        print_status "Stopping $name (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        sleep 1
        kill -9 "$pid" 2>/dev/null || true
        rm -f "$pidfile"
        print_success "$name stopped"
    else
        print_warning "$name not running"
    fi
}

# Docker functions
start_docker() {
    local compose_cmd=$(get_compose_cmd)
    if [ -z "$compose_cmd" ]; then
        print_error "Docker Compose not available"
        return 1
    fi

    print_status "Starting services with Docker..."
    cd "$PROJECT_DIR"
    $compose_cmd up -d --build
    sleep 3
}

stop_docker() {
    local compose_cmd=$(get_compose_cmd)
    if [ -n "$compose_cmd" ]; then
        cd "$PROJECT_DIR"
        $compose_cmd down 2>/dev/null || true
    fi
}

# Main commands
cmd_start() {
    ensure_dirs

    local mode=${1:-auto}

    case "$mode" in
        docker)
            if has_docker; then
                start_docker
            else
                print_error "Docker not available"
                exit 1
            fi
            ;;
        native)
            if ! has_native; then
                print_error "Native binaries not found. Run: ./scripts/build.sh"
                exit 1
            fi
            start_crawler_native
            sleep 2  # Let crawler initialize DB
            start_api_native
            start_frontend_native
            ;;
        auto)
            if has_native; then
                print_status "Using native binaries from out/"
                start_crawler_native
                sleep 2
                start_api_native
                start_frontend_native
            elif has_docker; then
                print_status "Using Docker"
                start_docker
            else
                print_error "Neither native binaries nor Docker available"
                print_status "Run: ./scripts/build.sh  OR  install Docker"
                exit 1
            fi
            ;;
    esac

    sleep 2
    cmd_status
}

cmd_stop() {
    print_status "Stopping all services..."

    # Stop native services
    stop_service "Frontend" "$FRONTEND_PID"
    stop_service "API" "$API_PID"
    stop_service "Crawler" "$CRAWLER_PID"

    # Stop Docker if running
    stop_docker

    print_success "All services stopped"
}

cmd_restart() {
    cmd_stop
    sleep 1
    cmd_start "$1"
}

cmd_status() {
    echo ""
    echo "======================================"
    echo "  Quotator Service Status"
    echo "======================================"
    echo ""

    # Check services
    check_service "Crawler" "http://localhost:3849/health" "$CRAWLER_PID"
    check_service "API" "http://localhost:3848/health" "$API_PID"
    check_service "Frontend" "http://localhost:3847" "$FRONTEND_PID"

    echo ""

    # Show Docker status if available
    local compose_cmd=$(get_compose_cmd)
    if [ -n "$compose_cmd" ] && has_docker; then
        echo "Docker Status:"
        cd "$PROJECT_DIR"
        $compose_cmd ps 2>/dev/null || echo "  No Docker containers"
    fi

    echo ""
}

check_service() {
    local name=$1
    local url=$2
    local pidfile=$3

    local status=""
    local pid_info=""

    if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
        status="${GREEN}Running${NC}"
    else
        status="${RED}Not responding${NC}"
    fi

    if [ -n "$pidfile" ] && is_running "$pidfile"; then
        pid_info=" (PID: $(get_pid $pidfile))"
    fi

    echo -e "  $name: $status at $url$pid_info"
}

cmd_health() {
    echo ""
    echo "======================================"
    echo "  Quotator Health Check"
    echo "======================================"
    echo ""

    # Crawler
    print_status "Checking Crawler..."
    local crawler_health=$(curl -s http://localhost:3849/health 2>/dev/null)
    if [ -n "$crawler_health" ]; then
        print_success "Crawler: $crawler_health"
    else
        print_error "Crawler not responding"
    fi

    local crawler_status=$(curl -s http://localhost:3849/status 2>/dev/null)
    if [ -n "$crawler_status" ]; then
        print_success "Status: $crawler_status"
    fi

    # API
    echo ""
    print_status "Checking API..."
    local api_health=$(curl -s http://localhost:3848/health 2>/dev/null)
    if [ -n "$api_health" ]; then
        print_success "API: $api_health"
    else
        print_error "API not responding"
    fi

    # Pricing Data
    echo ""
    print_status "Checking Pricing Data..."
    local flavors=$(curl -s http://localhost:3848/flavors 2>/dev/null)
    if [ -n "$flavors" ]; then
        local count=$(echo "$flavors" | grep -o '"id"' | wc -l | tr -d ' ')
        print_success "ECS Flavors: $count instance types"
    else
        print_error "No flavor data"
    fi

    local disks=$(curl -s http://localhost:3848/disks 2>/dev/null)
    if [ -n "$disks" ]; then
        local count=$(echo "$disks" | grep -o '"id"' | wc -l | tr -d ' ')
        print_success "EVS Disk Types: $count types"
    else
        print_error "No disk data"
    fi

    echo ""
}

cmd_logs() {
    local service=${1:-all}

    case "$service" in
        crawler)
            tail -f "$LOG_DIR/crawler.log"
            ;;
        api)
            tail -f "$LOG_DIR/api.log"
            ;;
        frontend)
            tail -f "$LOG_DIR/frontend.log"
            ;;
        all)
            tail -f "$LOG_DIR"/*.log
            ;;
        *)
            echo "Usage: $0 logs [crawler|api|frontend|all]"
            ;;
    esac
}

cmd_build() {
    "$SCRIPT_DIR/build.sh" "${1:-all}"
}

cmd_crawl() {
    print_status "Triggering pricing crawl..."
    local result=$(curl -s -X POST http://localhost:3849/crawl 2>/dev/null)
    if [ -n "$result" ]; then
        print_success "Crawl triggered: $result"
    else
        print_error "Failed to trigger crawl"
    fi
}

# Install as system service (Linux systemd)
cmd_install_service() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        install_systemd_service
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        install_launchd_service
    else
        print_error "Service installation not supported on this OS"
        exit 1
    fi
}

cmd_uninstall_service() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        uninstall_systemd_service
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        uninstall_launchd_service
    else
        print_error "Service uninstallation not supported on this OS"
        exit 1
    fi
}

install_systemd_service() {
    print_status "Installing systemd service..."

    sudo tee /etc/systemd/system/quotator.service > /dev/null << EOF
[Unit]
Description=Quotator - Huawei Cloud Pricing Quote Generator
After=network.target

[Service]
Type=forking
WorkingDirectory=$PROJECT_DIR
ExecStart=$SCRIPT_DIR/quotator.sh start native
ExecStop=$SCRIPT_DIR/quotator.sh stop
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable quotator.service
    print_success "Systemd service installed"
    print_status "Use: sudo systemctl start|stop|status quotator"
}

uninstall_systemd_service() {
    print_status "Removing systemd service..."
    sudo systemctl stop quotator.service 2>/dev/null || true
    sudo systemctl disable quotator.service 2>/dev/null || true
    sudo rm -f /etc/systemd/system/quotator.service
    sudo systemctl daemon-reload
    print_success "Systemd service removed"
}

install_launchd_service() {
    print_status "Installing launchd service..."

    local plist_path="$HOME/Library/LaunchAgents/com.quotator.plist"
    mkdir -p "$HOME/Library/LaunchAgents"

    cat > "$plist_path" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.quotator</string>
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_DIR/quotator.sh</string>
        <string>start</string>
        <string>native</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
</dict>
</plist>
EOF

    launchctl load "$plist_path"
    print_success "Launchd service installed"
    print_status "Service will start automatically on login"
}

uninstall_launchd_service() {
    print_status "Removing launchd service..."
    local plist_path="$HOME/Library/LaunchAgents/com.quotator.plist"
    launchctl unload "$plist_path" 2>/dev/null || true
    rm -f "$plist_path"
    print_success "Launchd service removed"
}

cmd_help() {
    echo ""
    echo "Quotator Service Manager"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  start [docker|native]  Start services (auto-detect if not specified)"
    echo "  stop                   Stop all services"
    echo "  restart [docker|native] Restart services"
    echo "  status                 Show service status"
    echo "  health                 Detailed health check with data stats"
    echo "  logs [service]         View logs (crawler|api|frontend|all)"
    echo "  build [target]         Build services (crawler|api|frontend|all)"
    echo "  crawl                  Trigger pricing data refresh"
    echo "  install-service        Install as system service (auto-start)"
    echo "  uninstall-service      Remove system service"
    echo "  help                   Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 build               # Build all services to out/"
    echo "  $0 start               # Start with auto-detection"
    echo "  $0 start native        # Start from compiled binaries"
    echo "  $0 start docker        # Start with Docker"
    echo "  $0 health              # Check all services"
    echo "  $0 logs api            # View API logs"
    echo ""
}

# Main
case "${1:-}" in
    start)      cmd_start "$2" ;;
    stop)       cmd_stop ;;
    restart)    cmd_restart "$2" ;;
    status)     cmd_status ;;
    health)     cmd_health ;;
    logs)       cmd_logs "$2" ;;
    build)      cmd_build "$2" ;;
    crawl)      cmd_crawl ;;
    install-service)   cmd_install_service ;;
    uninstall-service) cmd_uninstall_service ;;
    help|--help|-h)    cmd_help ;;
    *)          cmd_help; exit 1 ;;
esac
