use crate::openrouter::types::{ModelEntry, ModelsResponse};
use reqwest::header;

const BASE_URL: &str = "https://openrouter.ai/api/v1";
const REFERER: &str = "https://github.com/brekz-app";
const APP_TITLE: &str = "Brekz";

fn build_client(api_key: &str) -> reqwest::Client {
    let mut headers = header::HeaderMap::new();
    headers.insert(
        header::AUTHORIZATION,
        header::HeaderValue::from_str(&format!("Bearer {}", api_key)).unwrap(),
    );
    headers.insert(
        header::HeaderName::from_static("http-referer"),
        header::HeaderValue::from_static(REFERER),
    );
    headers.insert(
        header::HeaderName::from_static("x-title"),
        header::HeaderValue::from_static(APP_TITLE),
    );

    reqwest::Client::builder()
        .default_headers(headers)
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .unwrap()
}

pub async fn validate_api_key(api_key: &str) -> Result<bool, String> {
    let client = build_client(api_key);
    let url = format!("{}/models", BASE_URL);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    Ok(response.status().is_success())
}

pub async fn fetch_models(api_key: &str) -> Result<Vec<ModelEntry>, String> {
    let client = build_client(api_key);
    let url = format!("{}/models", BASE_URL);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    let body: ModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    Ok(body.data.into_iter().map(ModelEntry::from).collect())
}