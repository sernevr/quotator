use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Flavor {
    pub id: String,
    pub name: String,
    pub vcpus: i32,
    pub ram_gb: f64,
    pub price_hourly: f64,
    pub price_monthly: f64,
    pub price_yearly_1: f64,
    pub price_yearly_3: f64,
    pub region: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskType {
    pub id: String,
    pub name: String,
    pub price_per_gb: f64,
    pub region: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quote {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteItem {
    pub id: String,
    pub quote_id: String,
    pub flavor_id: Option<String>,
    pub flavor_name: Option<String>,
    pub vcpus: Option<i32>,
    pub ram_gb: Option<f64>,
    pub flavor_price: Option<f64>,
    pub disk_type_id: Option<String>,
    pub disk_type_name: Option<String>,
    pub disk_size_gb: Option<i32>,
    pub disk_price: Option<f64>,
    pub hostname: Option<String>,
    pub code_number: Option<String>,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateQuote {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateQuote {
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateQuoteItem {
    pub flavor_id: Option<String>,
    pub flavor_name: Option<String>,
    pub vcpus: Option<i32>,
    pub ram_gb: Option<f64>,
    pub flavor_price: Option<f64>,
    pub disk_type_id: Option<String>,
    pub disk_type_name: Option<String>,
    pub disk_size_gb: Option<i32>,
    pub disk_price: Option<f64>,
    pub hostname: Option<String>,
    pub code_number: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateQuoteItem {
    pub flavor_id: Option<String>,
    pub flavor_name: Option<String>,
    pub vcpus: Option<i32>,
    pub ram_gb: Option<f64>,
    pub flavor_price: Option<f64>,
    pub disk_type_id: Option<String>,
    pub disk_type_name: Option<String>,
    pub disk_size_gb: Option<i32>,
    pub disk_price: Option<f64>,
    pub hostname: Option<String>,
    pub code_number: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PricingData {
    pub flavors: Vec<Flavor>,
    pub disk_types: Vec<DiskType>,
}

#[derive(Debug, Deserialize)]
pub struct BestMatchQuery {
    pub vcpus: i32,
    pub ram_gb: f64,
}
