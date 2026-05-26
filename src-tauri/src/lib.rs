mod commands;
mod db;
mod openrouter;

use db::AppDatabase;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

fn init_database(app_data_dir: &std::path::Path) -> Result<AppDatabase, Box<dyn std::error::Error>> {
    std::fs::create_dir_all(app_data_dir)?;
    let db_path = app_data_dir.join("brekz.db");
    let conn = Connection::open(&db_path)?;

    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    conn.execute_batch(db::init::SCHEMA)?;

    Ok(AppDatabase {
        conn: Mutex::new(conn),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            let database = init_database(&app_data_dir).expect("failed to initialize database");
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::models::fetch_models,
            commands::settings::validate_api_key,
            commands::chat::send_message,
            commands::chat::generate_conversation_title,
            commands::conversations::create_conversation,
            commands::conversations::list_conversations,
            commands::conversations::get_conversation,
            commands::conversations::update_conversation,
            commands::conversations::delete_conversation,
            commands::messages::list_messages,
            commands::messages::insert_message,
            commands::messages::delete_message,
            commands::messages::set_conversation_title,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}