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

// Pagination
#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub search: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: u32,
    pub page: u32,
    pub limit: u32,
    pub total_pages: u32,
}

// Standardized API Error Response
#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
    pub code: String,
    pub details: Option<String>,
}

impl ApiError {
    pub fn new(error: &str, code: &str) -> Self {
        Self {
            error: error.to_string(),
            code: code.to_string(),
            details: None,
        }
    }

    pub fn with_details(error: &str, code: &str, details: &str) -> Self {
        Self {
            error: error.to_string(),
            code: code.to_string(),
            details: Some(details.to_string()),
        }
    }
}
