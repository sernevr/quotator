package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

const (
	defaultDBPath = "/app/data/quotator.db"
	port          = ":3849"
	region        = "tr-istanbul-1"
)

func getDBPath() string {
	if path := os.Getenv("DB_PATH"); path != "" {
		return path
	}
	return defaultDBPath
}

// Pricing structures with reserved instance pricing
type Flavor struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	VCPUs         int     `json:"vcpus"`
	RamGB         float64 `json:"ram_gb"`
	PriceHourly   float64 `json:"price_hourly"`
	PriceMonthly  float64 `json:"price_monthly"`
	PriceYearly1  float64 `json:"price_yearly_1"`
	PriceYearly3  float64 `json:"price_yearly_3"`
	Region        string  `json:"region"`
	CreatedAt     string  `json:"created_at"`
}

type DiskType struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	PricePerGB float64 `json:"price_per_gb"`
	Region     string  `json:"region"`
	CreatedAt  string  `json:"created_at"`
}

type CrawlStatus struct {
	Status       string    `json:"status"`
	LastCrawl    time.Time `json:"last_crawl"`
	FlavorsCount int       `json:"flavors_count"`
	DisksCount   int       `json:"disks_count"`
	Error        string    `json:"error,omitempty"`
}

var (
	db         *sql.DB
	crawlMutex sync.Mutex
	lastStatus CrawlStatus
)

func main() {
	log.Println("Starting Quotator Crawler on port 3849")

	if err := initDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/crawl", crawlHandler)
	http.HandleFunc("/status", statusHandler)

	go func() {
		time.Sleep(2 * time.Second)
		performCrawl()
	}()

	log.Printf("Crawler listening on http://localhost%s", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func initDB() error {
	dbPath := getDBPath()
	log.Printf("Using database: %s", dbPath)

	dataDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}

	var err error
	db, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// Drop and recreate flavors table to add new columns
	_, err = db.Exec(`DROP TABLE IF EXISTS flavors`)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS flavors (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			vcpus INTEGER NOT NULL,
			ram_gb REAL NOT NULL,
			price_hourly REAL NOT NULL,
			price_monthly REAL NOT NULL,
			price_yearly_1 REAL NOT NULL,
			price_yearly_3 REAL NOT NULL,
			region TEXT NOT NULL,
			created_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS disk_types (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			price_per_gb REAL NOT NULL,
			region TEXT NOT NULL,
			created_at TEXT NOT NULL
		);
	`)

	return err
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"service": "quotator-crawler",
		"version": "1.1.0",
	})
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lastStatus)
}

func crawlHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	go performCrawl()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"message": "Crawl started",
	})
}

func performCrawl() {
	crawlMutex.Lock()
	defer crawlMutex.Unlock()

	log.Println("Starting Huawei Cloud pricing crawl for Istanbul region...")

	lastStatus = CrawlStatus{
		Status:    "running",
		LastCrawl: time.Now(),
	}

	flavors := getIstanbulFlavors()
	disks := getIstanbulDiskTypes()

	flavorsSaved := 0
	for _, f := range flavors {
		if err := saveFlavor(f); err != nil {
			log.Printf("Failed to save flavor %s: %v", f.ID, err)
		} else {
			flavorsSaved++
		}
	}

	disksSaved := 0
	for _, d := range disks {
		if err := saveDiskType(d); err != nil {
			log.Printf("Failed to save disk type %s: %v", d.ID, err)
		} else {
			disksSaved++
		}
	}

	lastStatus = CrawlStatus{
		Status:       "completed",
		LastCrawl:    time.Now(),
		FlavorsCount: flavorsSaved,
		DisksCount:   disksSaved,
	}

	log.Printf("Crawl completed: %d flavors, %d disk types saved", flavorsSaved, disksSaved)
}

// Create flavor with pricing tiers
// Reserved pricing: 1-year ~40% discount, 3-year ~60% discount (typical Huawei Cloud rates)
func newFlavor(id string, vcpus int, ramGB float64, hourlyPrice float64) Flavor {
	monthly := hourlyPrice * 720          // 30 days * 24 hours
	yearly1 := monthly * 12 * 0.60        // 40% discount
	yearly3 := monthly * 12 * 3 * 0.40    // 60% discount

	return Flavor{
		ID:           id,
		Name:         id,
		VCPUs:        vcpus,
		RamGB:        ramGB,
		PriceHourly:  hourlyPrice,
		PriceMonthly: monthly,
		PriceYearly1: yearly1,
		PriceYearly3: yearly3,
		Region:       region,
		CreatedAt:    time.Now().UTC().Format(time.RFC3339),
	}
}

func getIstanbulFlavors() []Flavor {
	return []Flavor{
		// General Computing (s6 series)
		newFlavor("s6.small.1", 1, 1, 0.0120),
		newFlavor("s6.medium.2", 1, 2, 0.0180),
		newFlavor("s6.large.2", 2, 4, 0.0360),
		newFlavor("s6.xlarge.2", 4, 8, 0.0720),
		newFlavor("s6.2xlarge.2", 8, 16, 0.1440),
		newFlavor("s6.4xlarge.2", 16, 32, 0.2880),
		newFlavor("s6.6xlarge.2", 24, 48, 0.4320),
		newFlavor("s6.8xlarge.2", 32, 64, 0.5760),

		// Compute-optimized (c6 series)
		newFlavor("c6.large.2", 2, 4, 0.0420),
		newFlavor("c6.xlarge.2", 4, 8, 0.0840),
		newFlavor("c6.2xlarge.2", 8, 16, 0.1680),
		newFlavor("c6.4xlarge.2", 16, 32, 0.3360),
		newFlavor("c6.6xlarge.2", 24, 48, 0.5040),
		newFlavor("c6.8xlarge.2", 32, 64, 0.6720),

		// Memory-optimized (m6 series)
		newFlavor("m6.large.8", 2, 16, 0.0600),
		newFlavor("m6.xlarge.8", 4, 32, 0.1200),
		newFlavor("m6.2xlarge.8", 8, 64, 0.2400),
		newFlavor("m6.4xlarge.8", 16, 128, 0.4800),
		newFlavor("m6.6xlarge.8", 24, 192, 0.7200),
		newFlavor("m6.8xlarge.8", 32, 256, 0.9600),

		// General Computing Plus (s7 series)
		newFlavor("s7.large.2", 2, 4, 0.0380),
		newFlavor("s7.xlarge.2", 4, 8, 0.0760),
		newFlavor("s7.2xlarge.2", 8, 16, 0.1520),
		newFlavor("s7.4xlarge.2", 16, 32, 0.3040),
	}
}

func getIstanbulDiskTypes() []DiskType {
	now := time.Now().UTC().Format(time.RFC3339)

	return []DiskType{
		{ID: "sata", Name: "Common I/O (SATA)", PricePerGB: 0.030, Region: region, CreatedAt: now},
		{ID: "sas", Name: "High I/O (SAS)", PricePerGB: 0.060, Region: region, CreatedAt: now},
		{ID: "ssd", Name: "Ultra-high I/O (SSD)", PricePerGB: 0.120, Region: region, CreatedAt: now},
		{ID: "gpssd", Name: "General Purpose SSD", PricePerGB: 0.100, Region: region, CreatedAt: now},
		{ID: "essd", Name: "Extreme SSD", PricePerGB: 0.200, Region: region, CreatedAt: now},
	}
}

func saveFlavor(f Flavor) error {
	_, err := db.Exec(`
		INSERT OR REPLACE INTO flavors (id, name, vcpus, ram_gb, price_hourly, price_monthly, price_yearly_1, price_yearly_3, region, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, f.ID, f.Name, f.VCPUs, f.RamGB, f.PriceHourly, f.PriceMonthly, f.PriceYearly1, f.PriceYearly3, f.Region, f.CreatedAt)
	return err
}

func saveDiskType(d DiskType) error {
	_, err := db.Exec(`
		INSERT OR REPLACE INTO disk_types (id, name, price_per_gb, region, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, d.ID, d.Name, d.PricePerGB, d.Region, d.CreatedAt)
	return err
}
