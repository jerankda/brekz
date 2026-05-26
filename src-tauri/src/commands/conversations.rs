use crate::db::AppDatabase;
use crate::db::queries;
use crate::openrouter::types::Conversation;

#[tauri::command]
pub async fn create_conversation(
    db: tauri::State<'_, AppDatabase>,
    title: String,
    model: String,
    system_prompt: String,
) -> Result<Conversation, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let conv = Conversation {
        id: id.clone(),
        title,
        model,
        system_prompt,
        created_at: now.clone(),
        updated_at: now,
    };

    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;
    queries::create_conversation(&conn, &conv)?;
    Ok(conv)
}

#[tauri::command]
pub async fn list_conversations(
    db: tauri::State<'_, AppDatabase>,
) -> Result<Vec<Conversation>, String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;
    queries::list_conversations(&conn)
}

#[tauri::command]
pub async fn get_conversation(
    db: tauri::State<'_, AppDatabase>,
    id: String,
) -> Result<Conversation, String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;
    queries::get_conversation(&conn, &id)
}

#[tauri::command]
pub async fn update_conversation(
    db: tauri::State<'_, AppDatabase>,
    id: String,
    title: Option<String>,
    model: Option<String>,
    system_prompt: Option<String>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;
    queries::update_conversation(&conn, &id, title.as_deref(), model.as_deref(), system_prompt.as_deref())
}

#[tauri::command]
pub async fn delete_conversation(
    db: tauri::State<'_, AppDatabase>,
    id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("DB lock error: {}", e))?;
    queries::delete_conversation(&conn, &id)
}