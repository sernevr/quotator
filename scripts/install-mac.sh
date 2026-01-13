#!/bin/bash
set -e

echo "======================================"
echo "  Quotator - macOS Installation"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Homebrew is installed
check_brew() {
    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}Homebrew not found. Installing...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    echo -e "${GREEN}✓ Homebrew available${NC}"
}

# Install Docker via Homebrew (colima + docker)
install_docker() {
    echo ""
    echo "Checking Docker..."

    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✓ Docker already installed${NC}"
    else
        echo -e "${YELLOW}Installing Docker CLI and Colima (lightweight Docker runtime)...${NC}"
        brew install docker docker-compose colima
    fi

    # Start Colima if not running
    if ! colima status 2>/dev/null | grep -q "Running"; then
        echo "Starting Colima..."
        colima start --cpu 2 --memory 4
    fi

    echo -e "${GREEN}✓ Docker runtime ready${NC}"
}

# Main installation
main() {
    echo "This script will install Quotator using:"
    echo "  - Colima (lightweight Docker runtime, no Docker Desktop needed)"
    echo "  - Docker CLI & Docker Compose"
    echo ""

    check_brew
    install_docker

    echo ""
    echo "Building and starting Quotator services..."

    # Navigate to project root
    cd "$(dirname "$0")/.."

    # Build and start containers
    docker compose up -d --build

    echo ""
    echo "======================================"
    echo -e "${GREEN}  Installation Complete!${NC}"
    echo "======================================"
    echo ""
    echo "Services running at:"
    echo "  Frontend: http://localhost:3847"
    echo "  API:      http://localhost:3848"
    echo "  Crawler:  http://localhost:3849"
    echo ""
    echo "Commands:"
    echo "  Start:   docker compose up -d"
    echo "  Stop:    docker compose down"
    echo "  Logs:    docker compose logs -f"
    echo ""
}

main "$@"
