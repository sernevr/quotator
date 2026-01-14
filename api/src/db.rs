use rusqlite::{params, Connection, Result};
use std::path::Path;

use crate::models::*;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        if let Some(parent) = Path::new(db_path).parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        self.conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS flavors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                vcpus INTEGER NOT NULL,
                ram_gb REAL NOT NULL,
                price_hourly REAL NOT NULL,
                price_monthly REAL NOT NULL DEFAULT 0,
                price_yearly_1 REAL NOT NULL DEFAULT 0,
                price_yearly_3 REAL NOT NULL DEFAULT 0,
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

            CREATE TABLE IF NOT EXISTS quotes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS quote_items (
                id TEXT PRIMARY KEY,
                quote_id TEXT NOT NULL,
                flavor_id TEXT,
                flavor_name TEXT,
                vcpus INTEGER,
                ram_gb REAL,
                flavor_price REAL,
                disk_type_id TEXT,
                disk_type_name TEXT,
                disk_size_gb INTEGER,
                disk_price REAL,
                hostname TEXT,
                code_number TEXT,
                description TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
            "#,
        )?;
        Ok(())
    }

    // Flavor operations
    pub fn get_flavors(&self) -> Result<Vec<Flavor>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, vcpus, ram_gb, price_hourly, price_monthly, price_yearly_1, price_yearly_3, region, created_at FROM flavors ORDER BY vcpus, ram_gb"
        )?;

        let flavors = stmt.query_map([], |row| {
            Ok(Flavor {
                id: row.get(0)?,
                name: row.get(1)?,
                vcpus: row.get(2)?,
                ram_gb: row.get(3)?,
                price_hourly: row.get(4)?,
                price_monthly: row.get(5)?,
                price_yearly_1: row.get(6)?,
                price_yearly_3: row.get(7)?,
                region: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?.collect::<Result<Vec<_>>>()?;

        Ok(flavors)
    }

    // Find best matching flavors for given CPU/RAM requirements
    pub fn find_best_match(&self, vcpus: i32, ram_gb: f64) -> Result<Vec<Flavor>> {
        let mut stmt = self.conn.prepare(
            r#"SELECT id, name, vcpus, ram_gb, price_hourly, price_monthly, price_yearly_1, price_yearly_3, region, created_at
               FROM flavors
               WHERE vcpus >= ?1 AND ram_gb >= ?2
               ORDER BY price_hourly ASC
               LIMIT 5"#
        )?;

        let flavors = stmt.query_map(params![vcpus, ram_gb], |row| {
            Ok(Flavor {
                id: row.get(0)?,
                name: row.get(1)?,
                vcpus: row.get(2)?,
                ram_gb: row.get(3)?,
                price_hourly: row.get(4)?,
                price_monthly: row.get(5)?,
                price_yearly_1: row.get(6)?,
                price_yearly_3: row.get(7)?,
                region: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?.collect::<Result<Vec<_>>>()?;

        Ok(flavors)
    }

    // Disk type operations
    pub fn get_disk_types(&self) -> Result<Vec<DiskType>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, price_per_gb, region, created_at FROM disk_types ORDER BY price_per_gb"
        )?;

        let disks = stmt.query_map([], |row| {
            Ok(DiskType {
                id: row.get(0)?,
                name: row.get(1)?,
                price_per_gb: row.get(2)?,
                region: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?.collect::<Result<Vec<_>>>()?;

        Ok(disks)
    }

    // Quote operations
    pub fn get_quotes(&self) -> Result<Vec<Quote>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, created_at, updated_at FROM quotes ORDER BY updated_at DESC"
        )?;

        let quotes = stmt.query_map([], |row| {
            Ok(Quote {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })?.collect::<Result<Vec<_>>>()?;

        Ok(quotes)
    }

    pub fn get_quote(&self, id: &str) -> Result<Option<Quote>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, created_at, updated_at FROM quotes WHERE id = ?1"
        )?;

        let mut quotes = stmt.query_map([id], |row| {
            Ok(Quote {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })?;

        Ok(quotes.next().transpose()?)
    }

    pub fn create_quote(&self, name: &str) -> Result<Quote> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        self.conn.execute(
            "INSERT INTO quotes (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![&id, name, &now, &now],
        )?;

        Ok(Quote {
            id,
            name: name.to_string(),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn update_quote(&self, id: &str, name: &str) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE quotes SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![name, &now, id],
        )?;
        Ok(())
    }

    pub fn delete_quote(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM quote_items WHERE quote_id = ?1", [id])?;
        self.conn.execute("DELETE FROM quotes WHERE id = ?1", [id])?;
        Ok(())
    }

    // Quote item operations
    pub fn get_items(&self, quote_id: &str) -> Result<Vec<QuoteItem>> {
        let mut stmt = self.conn.prepare(
            r#"SELECT id, quote_id, flavor_id, flavor_name, vcpus, ram_gb, flavor_price,
               disk_type_id, disk_type_name, disk_size_gb, disk_price,
               hostname, code_number, description, created_at, updated_at
               FROM quote_items WHERE quote_id = ?1 ORDER BY created_at"#
        )?;

        let items = stmt.query_map([quote_id], |row| {
            Ok(QuoteItem {
                id: row.get(0)?,
                quote_id: row.get(1)?,
                flavor_id: row.get(2)?,
                flavor_name: row.get(3)?,
                vcpus: row.get(4)?,
                ram_gb: row.get(5)?,
                flavor_price: row.get(6)?,
                disk_type_id: row.get(7)?,
                disk_type_name: row.get(8)?,
                disk_size_gb: row.get(9)?,
                disk_price: row.get(10)?,
                hostname: row.get(11)?,
                code_number: row.get(12)?,
                description: row.get(13)?,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })?.collect::<Result<Vec<_>>>()?;

        Ok(items)
    }

    pub fn create_item(&self, quote_id: &str, item: &CreateQuoteItem) -> Result<QuoteItem> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        self.conn.execute(
            r#"INSERT INTO quote_items (id, quote_id, flavor_id, flavor_name, vcpus, ram_gb, flavor_price,
               disk_type_id, disk_type_name, disk_size_gb, disk_price, hostname, code_number, description,
               created_at, updated_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)"#,
            params![
                &id, quote_id, &item.flavor_id, &item.flavor_name, &item.vcpus, &item.ram_gb, &item.flavor_price,
                &item.disk_type_id, &item.disk_type_name, &item.disk_size_gb, &item.disk_price,
                &item.hostname, &item.code_number, &item.description, &now, &now
            ],
        )?;

        Ok(QuoteItem {
            id,
            quote_id: quote_id.to_string(),
            flavor_id: item.flavor_id.clone(),
            flavor_name: item.flavor_name.clone(),
            vcpus: item.vcpus,
            ram_gb: item.ram_gb,
            flavor_price: item.flavor_price,
            disk_type_id: item.disk_type_id.clone(),
            disk_type_name: item.disk_type_name.clone(),
            disk_size_gb: item.disk_size_gb,
            disk_price: item.disk_price,
            hostname: item.hostname.clone(),
            code_number: item.code_number.clone(),
            description: item.description.clone(),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn update_item(&self, item_id: &str, item: &UpdateQuoteItem) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();

        self.conn.execute(
            r#"UPDATE quote_items SET
               flavor_id = COALESCE(?1, flavor_id),
               flavor_name = COALESCE(?2, flavor_name),
               vcpus = COALESCE(?3, vcpus),
               ram_gb = COALESCE(?4, ram_gb),
               flavor_price = COALESCE(?5, flavor_price),
               disk_type_id = COALESCE(?6, disk_type_id),
               disk_type_name = COALESCE(?7, disk_type_name),
               disk_size_gb = COALESCE(?8, disk_size_gb),
               disk_price = COALESCE(?9, disk_price),
               hostname = COALESCE(?10, hostname),
               code_number = COALESCE(?11, code_number),
               description = COALESCE(?12, description),
               updated_at = ?13
               WHERE id = ?14"#,
            params![
                &item.flavor_id, &item.flavor_name, &item.vcpus, &item.ram_gb, &item.flavor_price,
                &item.disk_type_id, &item.disk_type_name, &item.disk_size_gb, &item.disk_price,
                &item.hostname, &item.code_number, &item.description, &now, item_id
            ],
        )?;
        Ok(())
    }

    pub fn delete_item(&self, item_id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM quote_items WHERE id = ?1", [item_id])?;
        Ok(())
    }
}
