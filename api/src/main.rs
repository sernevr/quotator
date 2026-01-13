mod db;
mod handlers;
mod models;

use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use std::sync::Mutex;

use db::Database;

pub struct AppState {
    pub db: Mutex<Database>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    log::info!("Starting Quotator API on port 3848");

    // Initialize database
    let db = Database::new("../data/quotator.db").expect("Failed to initialize database");

    let app_state = web::Data::new(AppState {
        db: Mutex::new(db),
    });

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .app_data(app_state.clone())
            .wrap(cors)
            .wrap(Logger::default())
            // Pricing endpoints
            .route("/flavors", web::get().to(handlers::get_flavors))
            .route("/disks", web::get().to(handlers::get_disk_types))
            .route("/pricing", web::get().to(handlers::get_all_pricing))
            .route("/crawl", web::post().to(handlers::trigger_crawl))
            // Quote endpoints
            .route("/quotes", web::get().to(handlers::get_quotes))
            .route("/quotes", web::post().to(handlers::create_quote))
            .route("/quotes/{id}", web::get().to(handlers::get_quote))
            .route("/quotes/{id}", web::put().to(handlers::update_quote))
            .route("/quotes/{id}", web::delete().to(handlers::delete_quote))
            // Quote items endpoints
            .route("/quotes/{quote_id}/items", web::get().to(handlers::get_items))
            .route("/quotes/{quote_id}/items", web::post().to(handlers::create_item))
            .route("/quotes/{quote_id}/items/{item_id}", web::put().to(handlers::update_item))
            .route("/quotes/{quote_id}/items/{item_id}", web::delete().to(handlers::delete_item))
            // Health check
            .route("/health", web::get().to(handlers::health_check))
    })
    .bind("0.0.0.0:3848")?
    .run()
    .await
}
