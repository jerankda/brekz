use tauri::AppHandle;

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