use crate::openrouter::client;

#[tauri::command]
pub async fn validate_api_key(api_key: String) -> Result<bool, String> {
    client::validate_api_key(&api_key).await
}