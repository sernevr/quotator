# Quotator - Windows Installation Script
# Run as Administrator

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Quotator - Windows Installation" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator!" -ForegroundColor Red
    exit 1
}

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Install Chocolatey if not present
function Install-Chocolatey {
    if (-not (Test-Command choco)) {
        Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
    Write-Host "[OK] Chocolatey available" -ForegroundColor Green
}

# Install Docker via WSL2
function Install-Docker {
    Write-Host ""
    Write-Host "Checking Docker..." -ForegroundColor Cyan

    if (Test-Command docker) {
        Write-Host "[OK] Docker already installed" -ForegroundColor Green
        return
    }

    Write-Host "Installing Docker..." -ForegroundColor Yellow

    # Enable WSL2 feature
    Write-Host "Enabling WSL2..." -ForegroundColor Yellow
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

    # Install WSL2 kernel update
    Write-Host "Downloading WSL2 kernel update..." -ForegroundColor Yellow
    $wslUpdateUrl = "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi"
    $wslUpdatePath = "$env:TEMP\wsl_update_x64.msi"
    Invoke-WebRequest -Uri $wslUpdateUrl -OutFile $wslUpdatePath
    Start-Process msiexec.exe -Wait -ArgumentList "/i $wslUpdatePath /quiet"

    # Set WSL2 as default
    wsl --set-default-version 2

    # Install Docker via Chocolatey
    choco install docker-cli docker-compose -y

    Write-Host "[OK] Docker installed" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: You need to install a WSL2 Linux distro for Docker to work." -ForegroundColor Yellow
    Write-Host "Run: wsl --install -d Ubuntu" -ForegroundColor Yellow
    Write-Host "Then restart your computer." -ForegroundColor Yellow
}

# Main installation
function Main {
    Write-Host "This script will install Quotator using:"
    Write-Host "  - WSL2 (Windows Subsystem for Linux)"
    Write-Host "  - Docker Engine (no Docker Desktop needed)"
    Write-Host ""

    Install-Chocolatey
    Install-Docker

    # Navigate to project root
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot

    Write-Host ""
    Write-Host "Building and starting Quotator services..." -ForegroundColor Cyan

    # Build and start containers
    docker compose up -d --build

    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  Installation Complete!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Services running at:"
    Write-Host "  Frontend: http://localhost:3847"
    Write-Host "  API:      http://localhost:3848"
    Write-Host "  Crawler:  http://localhost:3849"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  Start:   docker compose up -d"
    Write-Host "  Stop:    docker compose down"
    Write-Host "  Logs:    docker compose logs -f"
    Write-Host ""
}

Main
