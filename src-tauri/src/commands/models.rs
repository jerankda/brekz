use crate::openrouter::client;
use crate::openrouter::types::ModelEntry;

#[tauri::command]
pub async fn fetch_models(api_key: String) -> Result<Vec<ModelEntry>, String> {
    client::fetch_models(&api_key).await
}