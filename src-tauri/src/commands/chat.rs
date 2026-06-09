use tauri::AppHandle;

use crate::db::AppDatabase;
use crate::db::queries;
use crate::openrouter::client;
use crate::openrouter::types::{ChatMessage, ChatSettings, FileAttachment};

#[tauri::command]
pub async fn send_message(
    app: AppHandle,
    api_key: String,
    conversation_id: String,
    model: String,
    messages: Vec<ChatMessage>,
    settings: ChatSettings,
    files: Option<Vec<FileAttachment>>,
) -> Result<(), String> {
    let mut chat_messages = messages;
    if let Some(attachments) = files {
        if let Some(last) = chat_messages.last_mut() {
            if last.role == "user" {
                let text = last
                    .content
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let parts: Vec<_> = attachments.iter().map(crate::openrouter::types::ContentPart::from_attachment).collect();
                *last = ChatMessage::with_parts("user", &text, parts);
            }
        }
    }
    client::stream_chat(&app, &api_key, &conversation_id, &model, &chat_messages, &settings).await
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