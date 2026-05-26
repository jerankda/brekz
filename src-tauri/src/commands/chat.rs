use tauri::AppHandle;

use crate::db::AppDatabase;
use crate::db::queries;
use crate::openrouter::client;
use crate::openrouter::types::{ChatMessage, ChatSettings};

#[tauri::command]
pub async fn send_message(
    app: AppHandle,
    api_key: String,
    conversation_id: String,
    model: String,
    messages: Vec<ChatMessage>,
    settings: ChatSettings,
) -> Result<(), String> {
    client::stream_chat(&app, &api_key, &conversation_id, &model, &messages, &settings).await
}

#[tauri::command]
pub async fn generate_conversation_title(
    db: tauri::State<'_, AppDatabase>,
    api_key: String,
    conversation_id: String,
    user_message: String,
    assistant_message: String,
) -> Result<(), String> {
    match client::generate_title(&api_key, &user_message, &assistant_message).await {
        Ok(title) => {
            let conn = db.conn.lock().map_err(|e| e.to_string())?;
            queries::update_conversation_title(&conn, &conversation_id, &title)
                .map_err(|e| e.to_string())?;
            Ok(())
        }
        Err(e) => {
            eprintln!("Title generation failed (non-critical): {}", e);
            Ok(())
        }
    }
}