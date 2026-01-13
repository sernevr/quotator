#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$PROJECT_DIR/out"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

echo ""
echo "======================================"
echo "  Quotator Build"
echo "======================================"
echo ""

# Create output directory
mkdir -p "$OUT_DIR"

# Build crawler (Go)
build_crawler() {
    print_status "Building crawler (Go)..."
    cd "$PROJECT_DIR/crawler"

    # Download dependencies
    go mod tidy

    # Build with CGO for SQLite
    CGO_ENABLED=1 go build -o "$OUT_DIR/crawler" .

    if [ -f "$OUT_DIR/crawler" ]; then
        print_success "Crawler built: $OUT_DIR/crawler"
    else
        print_error "Crawler build failed"
        exit 1
    fi
}

# Build API (Rust)
build_api() {
    print_status "Building API (Rust)..."
    cd "$PROJECT_DIR/api"

    # Build release
    cargo build --release

    # Copy to out directory
    cp "$PROJECT_DIR/api/target/release/quotator-api" "$OUT_DIR/"

    if [ -f "$OUT_DIR/quotator-api" ]; then
        print_success "API built: $OUT_DIR/quotator-api"
    else
        print_error "API build failed"
        exit 1
    fi
}

# Build frontend (Node.js)
build_frontend() {
    print_status "Building frontend (Node.js)..."
    cd "$PROJECT_DIR/frontend"

    # Install dependencies
    npm ci --silent 2>/dev/null || npm install --silent

    # Build
    npm run build

    # Copy to out directory
    rm -rf "$OUT_DIR/frontend"
    cp -r dist "$OUT_DIR/frontend"

    if [ -d "$OUT_DIR/frontend" ]; then
        print_success "Frontend built: $OUT_DIR/frontend"
    else
        print_error "Frontend build failed"
        exit 1
    fi
}

# Main
main() {
    local target=${1:-all}

    case "$target" in
        crawler)
            build_crawler
            ;;
        api)
            build_api
            ;;
        frontend)
            build_frontend
            ;;
        all)
            build_crawler
            build_api
            build_frontend
            ;;
        *)
            echo "Usage: $0 [crawler|api|frontend|all]"
            exit 1
            ;;
    esac

    echo ""
    print_success "Build complete!"
    echo ""
    echo "Output directory: $OUT_DIR"
    ls -la "$OUT_DIR"
    echo ""
}

main "$@"
