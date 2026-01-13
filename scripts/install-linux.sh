#!/bin/bash
set -e

echo "======================================"
echo "  Quotator - Linux Installation"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect package manager
detect_pkg_manager() {
    if command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
    elif command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
    elif command -v pacman &> /dev/null; then
        PKG_MANAGER="pacman"
    else
        echo -e "${RED}Unsupported package manager${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Detected package manager: $PKG_MANAGER${NC}"
}

# Install Docker
install_docker() {
    echo ""
    echo "Checking Docker..."

    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✓ Docker already installed${NC}"
    else
        echo -e "${YELLOW}Installing Docker...${NC}"

        case $PKG_MANAGER in
            apt)
                sudo apt-get update
                sudo apt-get install -y ca-certificates curl gnupg
                sudo install -m 0755 -d /etc/apt/keyrings
                curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
                sudo chmod a+r /etc/apt/keyrings/docker.gpg
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
                sudo apt-get update
                sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
                ;;
            dnf|yum)
                sudo $PKG_MANAGER install -y dnf-plugins-core
                sudo $PKG_MANAGER config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
                sudo $PKG_MANAGER install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
                ;;
            pacman)
                sudo pacman -S --noconfirm docker docker-compose
                ;;
        esac

        # Start Docker service
        sudo systemctl start docker
        sudo systemctl enable docker

        # Add current user to docker group
        sudo usermod -aG docker $USER
        echo -e "${YELLOW}Note: You may need to log out and back in for docker group changes to take effect${NC}"
    fi

    echo -e "${GREEN}✓ Docker ready${NC}"
}

# Install Docker Compose (standalone)
install_compose() {
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose available${NC}"
    else
        echo -e "${YELLOW}Installing Docker Compose...${NC}"
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
        sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo -e "${GREEN}✓ Docker Compose installed${NC}"
    fi
}

# Main installation
main() {
    echo "This script will install Quotator using Docker Engine"
    echo "(No Docker Desktop required)"
    echo ""

    detect_pkg_manager
    install_docker
    install_compose

    echo ""
    echo "Building and starting Quotator services..."

    # Navigate to project root
    cd "$(dirname "$0")/.."

    # Build and start containers
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d --build
    else
        docker compose up -d --build
    fi

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
