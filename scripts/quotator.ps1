# Quotator Service Manager for Windows
param(
    [Parameter(Position=0)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'health', 'logs', 'crawl', 'install-service', 'uninstall-service', 'help')]
    [string]$Command = 'help',

    [Parameter(Position=1)]
    [string]$Service = ''
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$ServiceName = "Quotator"

function Write-Status($msg) { Write-Host "[*] $msg" -ForegroundColor Blue }
function Write-Success($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Err($msg) { Write-Host "[X] $msg" -ForegroundColor Red }
function Write-Warn($msg) { Write-Host "[!] $msg" -ForegroundColor Yellow }

function Test-ServiceUrl($url) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}

function Start-Quotator {
    Write-Status "Starting Quotator services..."
    Set-Location $ProjectDir
    docker compose up -d --build
    Start-Sleep -Seconds 3
    Get-QuotatorStatus
}

function Stop-Quotator {
    Write-Status "Stopping Quotator services..."
    Set-Location $ProjectDir
    docker compose down
    Write-Success "Services stopped"
}

function Restart-Quotator {
    Stop-Quotator
    Start-Quotator
}

function Get-QuotatorStatus {
    Set-Location $ProjectDir

    Write-Host ""
    Write-Host "======================================"
    Write-Host "  Quotator Service Status"
    Write-Host "======================================"
    Write-Host ""

    if (Test-ServiceUrl "http://localhost:3847") {
        Write-Success "Frontend: Running at http://localhost:3847"
    } else {
        Write-Err "Frontend: Not responding"
    }

    if (Test-ServiceUrl "http://localhost:3848/health") {
        Write-Success "API: Running at http://localhost:3848"
    } else {
        Write-Err "API: Not responding"
    }

    if (Test-ServiceUrl "http://localhost:3849/health") {
        Write-Success "Crawler: Running at http://localhost:3849"
    } else {
        Write-Err "Crawler: Not responding"
    }

    Write-Host ""
    Write-Host "Container Status:"
    docker compose ps
    Write-Host ""
}

function Get-QuotatorHealth {
    Write-Host ""
    Write-Host "======================================"
    Write-Host "  Quotator Health Check"
    Write-Host "======================================"
    Write-Host ""

    Write-Status "Checking API..."
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:3848/health" -TimeoutSec 2
        Write-Success "API Health: $($health | ConvertTo-Json -Compress)"
    } catch {
        Write-Err "API not responding"
    }

    Write-Status "Checking Crawler..."
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:3849/health" -TimeoutSec 2
        Write-Success "Crawler Health: $($health | ConvertTo-Json -Compress)"
    } catch {
        Write-Err "Crawler not responding"
    }

    Write-Status "Checking Pricing Data..."
    try {
        $flavors = Invoke-RestMethod -Uri "http://localhost:3848/flavors" -TimeoutSec 2
        Write-Success "Flavors loaded: $($flavors.Count) instance types"
    } catch {
        Write-Err "No flavor data"
    }

    try {
        $disks = Invoke-RestMethod -Uri "http://localhost:3848/disks" -TimeoutSec 2
        Write-Success "Disk types loaded: $($disks.Count) types"
    } catch {
        Write-Err "No disk data"
    }

    Write-Host ""
}

function Get-QuotatorLogs {
    param([string]$Svc)
    Set-Location $ProjectDir
    if ($Svc) {
        docker compose logs -f $Svc
    } else {
        docker compose logs -f
    }
}

function Invoke-Crawl {
    Write-Status "Triggering pricing crawl..."
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:3849/crawl" -Method Post -TimeoutSec 30
        Write-Success "Crawl triggered: $($result | ConvertTo-Json -Compress)"
    } catch {
        Write-Err "Failed to trigger crawl: $_"
    }
}

function Install-QuotatorService {
    Write-Status "Installing Windows service..."

    $taskName = "Quotator"
    $action = New-ScheduledTaskAction -Execute "docker" -Argument "compose up -d" -WorkingDirectory $ProjectDir
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force

    Write-Success "Scheduled task '$taskName' installed"
    Write-Status "Service will start automatically on boot"
}

function Uninstall-QuotatorService {
    Write-Status "Removing Windows scheduled task..."
    Unregister-ScheduledTask -TaskName "Quotator" -Confirm:$false -ErrorAction SilentlyContinue
    Write-Success "Scheduled task removed"
}

function Show-Help {
    Write-Host ""
    Write-Host "Quotator Service Manager"
    Write-Host ""
    Write-Host "Usage: .\quotator.ps1 <command> [service]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  start             Start all services"
    Write-Host "  stop              Stop all services"
    Write-Host "  restart           Restart all services"
    Write-Host "  status            Show service status"
    Write-Host "  health            Detailed health check"
    Write-Host "  logs [service]    View logs (optional: frontend|api|crawler)"
    Write-Host "  crawl             Trigger pricing data refresh"
    Write-Host "  install-service   Install as Windows scheduled task"
    Write-Host "  uninstall-service Remove scheduled task"
    Write-Host "  help              Show this help"
    Write-Host ""
}

# Main
switch ($Command) {
    'start' { Start-Quotator }
    'stop' { Stop-Quotator }
    'restart' { Restart-Quotator }
    'status' { Get-QuotatorStatus }
    'health' { Get-QuotatorHealth }
    'logs' { Get-QuotatorLogs -Svc $Service }
    'crawl' { Invoke-Crawl }
    'install-service' { Install-QuotatorService }
    'uninstall-service' { Uninstall-QuotatorService }
    default { Show-Help }
}
