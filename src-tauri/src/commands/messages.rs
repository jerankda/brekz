use crate::db::AppDatabase;
use crate::db::queries;
use crate::openrouter::types::Message;

#[tauri::command]
pub async fn list_messages(
    db: tauri::State<'_, AppDatabase>,
    conversation_id: String,
) -> Result<Vec<Message>, String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;
    queries::list_messages(&conn, &conversation_id)
}

#[tauri::command]
pub async fn insert_message(
    db: tauri::State<'_, AppDatabase>,
    message: Message,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;
    queries::insert_message(&conn, &message)
}

#[tauri::command]
pub async fn delete_message(
    db: tauri::State<'_, AppDatabase>,
    id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;
    queries::delete_message(&conn, &id)
}

#[tauri::command]
pub async fn set_conversation_title(
    db: tauri::State<'_, AppDatabase>,
    id: String,
    title: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;
    queries::update_conversation_title(&conn, &id, &title)
}