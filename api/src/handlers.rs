use actix_web::{web, HttpResponse, Responder};

use crate::models::*;
use crate::AppState;

// Health check
pub async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "quotator-api",
        "version": "1.0.0"
    }))
}

// Pricing handlers
pub async fn get_flavors(data: web::Data<AppState>) -> impl Responder {
    let db = data.db.lock().unwrap();
    match db.get_flavors() {
        Ok(flavors) => HttpResponse::Ok().json(flavors),
        Err(e) => {
            log::error!("Failed to get flavors: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch flavors"
            }))
        }
    }
}

pub async fn get_disk_types(data: web::Data<AppState>) -> impl Responder {
    let db = data.db.lock().unwrap();
    match db.get_disk_types() {
        Ok(disks) => HttpResponse::Ok().json(disks),
        Err(e) => {
            log::error!("Failed to get disk types: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch disk types"
            }))
        }
    }
}

pub async fn get_all_pricing(data: web::Data<AppState>) -> impl Responder {
    let db = data.db.lock().unwrap();

    let flavors = match db.get_flavors() {
        Ok(f) => f,
        Err(e) => {
            log::error!("Failed to get flavors: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch pricing data"
            }));
        }
    };

    let disk_types = match db.get_disk_types() {
        Ok(d) => d,
        Err(e) => {
            log::error!("Failed to get disk types: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch pricing data"
            }));
        }
    };

    HttpResponse::Ok().json(PricingData { flavors, disk_types })
}

pub async fn trigger_crawl() -> impl Responder {
    // Trigger the crawler service
    let client = reqwest::Client::new();

    match client.post("http://localhost:3849/crawl")
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
    {
        Ok(resp) if resp.status().is_success() => {
            HttpResponse::Ok().json(serde_json::json!({
                "status": "ok",
                "message": "Crawl triggered successfully"
            }))
        }
        Ok(resp) => {
            log::warn!("Crawler returned error: {}", resp.status());
            HttpResponse::Ok().json(serde_json::json!({
                "status": "warning",
                "message": "Crawler may not be running"
            }))
        }
        Err(e) => {
            log::warn!("Failed to trigger crawler: {}", e);
            HttpResponse::Ok().json(serde_json::json!({
                "status": "warning",
                "message": "Crawler service not available"
            }))
        }
    }
}

// Quote handlers
pub async fn get_quotes(data: web::Data<AppState>) -> impl Responder {
    let db = data.db.lock().unwrap();
    match db.get_quotes() {
        Ok(quotes) => HttpResponse::Ok().json(quotes),
        Err(e) => {
            log::error!("Failed to get quotes: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch quotes"
            }))
        }
    }
}

pub async fn get_quote(
    data: web::Data<AppState>,
    path: web::Path<String>,
) -> impl Responder {
    let id = path.into_inner();
    let db = data.db.lock().unwrap();

    match db.get_quote(&id) {
        Ok(Some(quote)) => HttpResponse::Ok().json(quote),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Quote not found"
        })),
        Err(e) => {
            log::error!("Failed to get quote: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch quote"
            }))
        }
    }
}

pub async fn create_quote(
    data: web::Data<AppState>,
    body: web::Json<CreateQuote>,
) -> impl Responder {
    let db = data.db.lock().unwrap();

    match db.create_quote(&body.name) {
        Ok(quote) => HttpResponse::Created().json(quote),
        Err(e) => {
            log::error!("Failed to create quote: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create quote"
            }))
        }
    }
}

pub async fn update_quote(
    data: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<UpdateQuote>,
) -> impl Responder {
    let id = path.into_inner();
    let db = data.db.lock().unwrap();

    if let Some(name) = &body.name {
        match db.update_quote(&id, name) {
            Ok(_) => HttpResponse::Ok().json(serde_json::json!({
                "status": "ok"
            })),
            Err(e) => {
                log::error!("Failed to update quote: {}", e);
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to update quote"
                }))
            }
        }
    } else {
        HttpResponse::BadRequest().json(serde_json::json!({
            "error": "No update fields provided"
        }))
    }
}

pub async fn delete_quote(
    data: web::Data<AppState>,
    path: web::Path<String>,
) -> impl Responder {
    let id = path.into_inner();
    let db = data.db.lock().unwrap();

    match db.delete_quote(&id) {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "status": "ok"
        })),
        Err(e) => {
            log::error!("Failed to delete quote: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to delete quote"
            }))
        }
    }
}

// Quote item handlers
pub async fn get_items(
    data: web::Data<AppState>,
    path: web::Path<String>,
) -> impl Responder {
    let quote_id = path.into_inner();
    let db = data.db.lock().unwrap();

    match db.get_items(&quote_id) {
        Ok(items) => HttpResponse::Ok().json(items),
        Err(e) => {
            log::error!("Failed to get items: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch items"
            }))
        }
    }
}

pub async fn create_item(
    data: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<CreateQuoteItem>,
) -> impl Responder {
    let quote_id = path.into_inner();
    let db = data.db.lock().unwrap();

    match db.create_item(&quote_id, &body) {
        Ok(item) => HttpResponse::Created().json(item),
        Err(e) => {
            log::error!("Failed to create item: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create item"
            }))
        }
    }
}

pub async fn update_item(
    data: web::Data<AppState>,
    path: web::Path<(String, String)>,
    body: web::Json<UpdateQuoteItem>,
) -> impl Responder {
    let (_, item_id) = path.into_inner();
    let db = data.db.lock().unwrap();

    match db.update_item(&item_id, &body) {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "status": "ok"
        })),
        Err(e) => {
            log::error!("Failed to update item: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update item"
            }))
        }
    }
}

pub async fn delete_item(
    data: web::Data<AppState>,
    path: web::Path<(String, String)>,
) -> impl Responder {
    let (_, item_id) = path.into_inner();
    let db = data.db.lock().unwrap();

    match db.delete_item(&item_id) {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "status": "ok"
        })),
        Err(e) => {
            log::error!("Failed to delete item: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to delete item"
            }))
        }
    }
}

// Best match handler - find ECS instances by CPU/RAM requirements
pub async fn best_match(
    data: web::Data<AppState>,
    query: web::Query<BestMatchQuery>,
) -> impl Responder {
    let db = data.db.lock().unwrap();

    match db.find_best_match(query.vcpus, query.ram_gb) {
        Ok(flavors) => HttpResponse::Ok().json(flavors),
        Err(e) => {
            log::error!("Failed to find best match: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to find matching instances"
            }))
        }
    }
}
