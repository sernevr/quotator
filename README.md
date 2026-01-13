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

- **Auto-save**: Every action is saved immediately to browser cache and database
- **No save button**: Changes persist automatically as you type
- **ECS Instance Selection**: Choose from General Computing (s6/s7), Compute-optimized (c6), Memory-optimized (m6) series
- **EVS Disk Selection**: Common I/O (SATA), High I/O (SAS), Ultra-high I/O (SSD), General Purpose SSD, Extreme SSD
- **Quote Generation**: Create tables with hostnames, code numbers, descriptions, and cost summaries
- **Offline Support**: Browser cache enables offline data access

## Quick Start

### One Command Installation

**macOS:**
```bash
./scripts/install-mac.sh
```

**Linux:**
```bash
./scripts/install-linux.sh
```

**Windows (PowerShell as Administrator):**
```powershell
.\scripts\install-windows.ps1
```

### Manual Start

```bash
docker compose up -d --build
```

## Services

| Service  | Port | Technology      | Purpose                       |
|----------|------|-----------------|-------------------------------|
| Frontend | 3847 | React + Vite    | Web UI                        |
| API      | 3848 | Rust + Actix    | REST API + SQLite             |
| Crawler  | 3849 | Go              | Huawei Cloud pricing fetcher  |

## Usage

1. Open http://localhost:3847 in your browser
2. Click "Create Your First Quote"
3. Select an instance type from the dropdown
4. Optionally select a disk type and size
5. Fill in hostname, code number, and description
6. Click "Add Resource"
7. Repeat for all resources needed
8. View the summary table with total costs

## API Endpoints

### Pricing
- `GET /flavors` - List ECS instance types
- `GET /disks` - List EVS disk types
- `POST /crawl` - Trigger pricing refresh

### Quotes
- `GET /quotes` - List all quotes
- `POST /quotes` - Create quote
- `GET /quotes/:id` - Get quote
- `PUT /quotes/:id` - Update quote
- `DELETE /quotes/:id` - Delete quote

### Quote Items
- `GET /quotes/:id/items` - List items
- `POST /quotes/:id/items` - Add item
- `PUT /quotes/:id/items/:itemId` - Update item
- `DELETE /quotes/:id/items/:itemId` - Delete item

## Development

### Prerequisites (without Docker)

- Node.js 20+
- Rust 1.75+
- Go 1.21+

### Run Locally

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**API:**
```bash
cd api
cargo run
```

**Crawler:**
```bash
cd crawler
go run .
```

## Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild and start
docker compose up -d --build

# Remove volumes (clean database)
docker compose down -v
```

## Configuration

### Ports (chosen for readability, not common conflicts)

| Default | Purpose              |
|---------|---------------------|
| 3847    | Frontend            |
| 3848    | API                 |
| 3849    | Crawler             |

### Environment Variables

**API:**
- `RUST_LOG=info` - Logging level

### Database

SQLite database stored at `data/quotator.db`. Automatically created on first run.

## Pricing Data

Currently uses sample pricing data based on Huawei Cloud Istanbul region structure. The crawler is designed to be extended with actual Huawei Cloud API integration (requires OAuth2 authentication).

### Instance Types Available

- **s6/s7 series**: General Computing (1-32 vCPUs)
- **c6 series**: Compute-optimized (2-32 vCPUs)
- **m6 series**: Memory-optimized (2-32 vCPUs, high RAM)

### Disk Types Available

- SATA (Common I/O)
- SAS (High I/O)
- SSD (Ultra-high I/O)
- GPSSD (General Purpose SSD)
- ESSD (Extreme SSD)

## Browser Cache

Uses IndexedDB (via localforage) for optimal performance:

- Debounced writes prevent excessive storage operations
- Memory cache provides instant reads
- Automatic cleanup of old cache versions
- Maximum 100 cached items to prevent bloat

## License

MIT
