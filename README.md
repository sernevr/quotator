# Quotator

Huawei Cloud Pricing Quote Generator for Istanbul Region.

A full-stack application for generating pricing quotes based on Huawei Cloud ECS instances and EVS storage.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│      API        │────▶│    Crawler      │
│   React/Vite    │     │  Rust/Actix     │     │       Go        │
│   Port 3847     │     │   Port 3848     │     │   Port 3849     │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 ▼                       ▼
                        ┌─────────────────────────────────────┐
                        │           SQLite Database           │
                        │         (data/quotator.db)          │
                        └─────────────────────────────────────┘
```

## Features

- **Auto-save**: Every action saves immediately to browser cache and database
- **No save button**: Changes persist automatically as you type
- **ECS Instance Selection**: General Computing (s6/s7), Compute-optimized (c6), Memory-optimized (m6)
- **EVS Disk Selection**: SATA, SAS, SSD, General Purpose SSD, Extreme SSD
- **Quote Generation**: Tables with hostnames, code numbers, descriptions, cost summaries
- **Service Management**: Start/stop with optional system service installation

## Quick Start

### 1. Build

```bash
./scripts/build.sh
```

Compiles all services to `out/` directory.

### 2. Start

```bash
./scripts/quotator.sh start
```

### 3. Access

Open http://localhost:3847

## Service Manager

```bash
./scripts/quotator.sh <command>

Commands:
  build [target]      Build services (crawler|api|frontend|all)
  start [mode]        Start services (native|docker|auto)
  stop                Stop all services
  restart             Restart services
  status              Show service status
  health              Detailed health check
  logs [service]      View logs (crawler|api|frontend|all)
  crawl               Trigger pricing refresh
  install-service     Install as system service
  uninstall-service   Remove system service
```

## Installation

### Native (Development)

Prerequisites: Go 1.21+, Rust 1.75+, Node.js 20+

```bash
./scripts/build.sh
./scripts/quotator.sh start native
```

### Docker

```bash
# macOS
./scripts/install-mac.sh

# Linux
./scripts/install-linux.sh

# Windows (PowerShell Admin)
.\scripts\install-windows.ps1
```

## Services

| Service  | Port | Technology   | Purpose                  |
|----------|------|--------------|--------------------------|
| Frontend | 3847 | React/Vite   | Web UI                   |
| API      | 3848 | Rust/Actix   | REST API + SQLite        |
| Crawler  | 3849 | Go           | Pricing data fetcher     |

## API Endpoints

### Health
- `GET /health` - Health check

### Pricing
- `GET /flavors` - ECS instance types
- `GET /disks` - EVS disk types
- `POST /crawl` - Refresh pricing

### Quotes
- `GET /quotes` - List quotes
- `POST /quotes` - Create quote
- `GET /quotes/:id` - Get quote
- `PUT /quotes/:id` - Update quote
- `DELETE /quotes/:id` - Delete quote

### Quote Items
- `GET /quotes/:id/items` - List items
- `POST /quotes/:id/items` - Add item
- `PUT /quotes/:id/items/:itemId` - Update item
- `DELETE /quotes/:id/items/:itemId` - Delete item

## Testing

```bash
./scripts/test.sh
```

### Test Results

| Category | Tests | Status |
|----------|-------|--------|
| Service Health | 3 | PASS |
| Pricing Data | 3 | PASS |
| Quote CRUD | 7 | PASS |
| Security | 2 | PASS |
| Performance | 3 | PASS |
| Load Test | 1 | PASS |
| Data Validation | 3 | PASS |
| **Total** | **22** | **100%** |

Performance: ~30ms avg response, 100% success on 50 concurrent requests.

## Pricing Data

### ECS Instances (24 flavors)

| Series | Type | vCPU | RAM |
|--------|------|------|-----|
| s6/s7 | General Computing | 1-32 | 1-64 GB |
| c6 | Compute-optimized | 2-32 | 4-64 GB |
| m6 | Memory-optimized | 2-32 | 16-256 GB |

### EVS Disks (5 types)

| Type | Name | $/GB/month |
|------|------|------------|
| sata | Common I/O | 0.03 |
| sas | High I/O | 0.06 |
| gpssd | General Purpose SSD | 0.10 |
| ssd | Ultra-high I/O | 0.12 |
| essd | Extreme SSD | 0.20 |

## Project Structure

```
quotator/
├── api/              # Rust API
├── crawler/          # Go Crawler
├── frontend/         # React Frontend
├── scripts/          # Management scripts
├── data/             # Runtime data (gitignored)
├── out/              # Compiled binaries (gitignored)
└── docker-compose.yml
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `/app/data/quotator.db` | Database path |
| `RUST_LOG` | `info` | API log level |

## License

MIT
