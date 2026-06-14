use std::time::Duration;

use eventsource_stream::Eventsource;
use futures_util::StreamExt;
use reqwest::header;
use tauri::{Emitter, Runtime};

use crate::openrouter::types::{
    ChatMessage, ChatRequest, ChatResponse, ModelEntry, StreamChunkPayload,
    StreamDonePayload, Usage,
};

const BASE_URL: &str = "https://openrouter.ai/api/v1";
const REFERER: &str = "https://github.com/brekz-app";
const APP_TITLE: &str = "brekz.";

fn build_client(api_key: &str, read_timeout_secs: u64) -> Result<reqwest::Client, String> {
    let mut headers = header::HeaderMap::new();
    headers.insert(
        header::AUTHORIZATION,
        header::HeaderValue::from_str(&format!("Bearer {}", api_key))
            .map_err(|e| format!("Invalid API key format: {}", e))?,
    );
    headers.insert(
        header::HeaderName::from_static("http-referer"),
        header::HeaderValue::from_static(REFERER),
    );
    headers.insert(
        header::HeaderName::from_static("x-title"),
        header::HeaderValue::from_static(APP_TITLE),
    );
    headers.insert(
        header::CONTENT_TYPE,
        header::HeaderValue::from_static("application/json"),
    );

    reqwest::Client::builder()
        .default_headers(headers)
        .timeout(Duration::from_secs(read_timeout_secs))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))
}

pub async fn validate_api_key(api_key: &str) -> Result<bool, String> {
    let client = build_client(api_key, 15)?;
    let url = format!("{}/chat/completions", BASE_URL);

    let body = serde_json::json!({
        "model": "openai/gpt-4o-mini",
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 1,
        "stream": false
    });

    let response = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let status = response.status();
    Ok(status.is_success())
}

pub async fn fetch_models(api_key: &str) -> Result<Vec<ModelEntry>, String> {
    let client = build_client(api_key, 30)?;
    let url = format!("{}/models", BASE_URL);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    let data = body
        .get("data")
        .and_then(|d| d.as_array())
        .ok_or_else(|| "Invalid response: missing data array".to_string())?;

    let mut models = Vec::new();
    for item in data {
        let id = item
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let name = item
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or(&id)
            .to_string();
        let context_length = item
            .get("context_length")
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as u32;

        let prompt_pricing = item
            .pointer("/pricing/prompt")
            .and_then(|v| {
                v.as_str()
                    .and_then(|s| s.parse::<f64>().ok())
                    .or_else(|| v.as_f64())
            })
            .unwrap_or(0.0);
        let completion_pricing = item
            .pointer("/pricing/completion")
            .and_then(|v| {
                v.as_str()
                    .and_then(|s| s.parse::<f64>().ok())
                    .or_else(|| v.as_f64())
            })
            .unwrap_or(0.0);

        models.push(ModelEntry {
            id,
            name,
            context_length,
            prompt_pricing,
            completion_pricing,
        });
    }

    Ok(models)
}

pub async fn generate_title(api_key: &str, user_message: &str, assistant_message: &str) -> Result<String, String> {
    let client = build_client(api_key, 30)?;
    let url = format!("{}/chat/completions", BASE_URL);

    let prompt = format!(
        "Generate a concise, descriptive title (3-6 words, no quotes) for this conversation:\n\nUser: {}\nAssistant: {}\n\nTitle:",
        user_message, assistant_message
    );

    let body = serde_json::json!({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a title generator. Reply with ONLY the title, nothing else."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 30,
        "temperature": 0.3,
        "stream": false
    });

    let response = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Title generation failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Title API error: {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Title parse error: {}", e))?;

    let title = json
        .pointer("/choices/0/message/content")
        .and_then(|v| v.as_str())
        .unwrap_or("New Chat")
        .trim()
        .trim_matches('"')
        .trim_matches('\'')
        .trim()
        .to_string();

    Ok(title)
}

pub async fn stream_chat<R: Runtime>(
    app: &impl Emitter<R>,
    api_key: &str,
    conversation_id: &str,
    model: &str,
    messages: &[ChatMessage],
    settings: &super::types::ChatSettings,
) -> Result<(), String> {
    let client = build_client(api_key, 300)?;
    let url = format!("{}/chat/completions", BASE_URL);

    let body = ChatRequest {
        model: model.to_string(),
        messages: messages.to_vec(),
        stream: true,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        stream_options: Some(super::types::StreamOptions {
            include_usage: true,
        }),
    };

    let response = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                "Request timed out".to_string()
            } else if e.is_status() {
                let status = e.status().unwrap();
                match status.as_u16() {
                    401 => "Invalid API key".to_string(),
                    429 => "Rate limited. Please wait and try again.".to_string(),
                    _ => format!("HTTP {}", status),
                }
            } else {
                format!("Network error: {}", e)
            }
        })?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        return Err(match status {
            401 => "Invalid API key".to_string(),
            404 => "Model not found or does not support file uploads. Try switching to a multimodal model (Claude, GPT-4o, Gemini).".to_string(),
            429 => "Rate limited. Please wait and try again.".to_string(),
            _ => format!("API error: HTTP {}", status),
        });
    }

    let mut full_content = String::new();
    let mut final_usage: Option<Usage> = None;

    let mut stream = response.bytes_stream().eventsource();

    while let Some(item) = stream.next().await {
        match item {
            Ok(event) => {
                if event.data == "[DONE]" {
                    break;
                }

                match serde_json::from_str::<ChatResponse>(&event.data) {
                    Ok(chunk) => {
                        if let Some(usage) = chunk.usage {
                            final_usage = Some(usage);
                        }

                        if let Some(choice) = chunk.choices.first() {
                            if let Some(delta) = &choice.delta {
                                if let Some(ref content) = delta.content {
                                    full_content.push_str(content);
                                    let _ = app.emit(
                                        "stream-chunk",
                                        StreamChunkPayload {
                                            conversation_id: conversation_id.to_string(),
                                            delta: content.clone(),
                                        },
                                    );
                                }
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to parse SSE chunk: {} — data: {}", e, event.data);
                    }
                }
            }
            Err(e) => {
                return Err(format!("Stream error: {}", e));
            }
        }
    }

    let input_tokens = final_usage.as_ref().map(|u| u.prompt_tokens).unwrap_or(0);
    let output_tokens = final_usage
        .as_ref()
        .map(|u| u.completion_tokens)
        .unwrap_or(0);

    let _ = app.emit(
        "stream-done",
        StreamDonePayload {
            conversation_id: conversation_id.to_string(),
            content: full_content,
            model: model.to_string(),
            input_tokens,
            output_tokens,
        },
    );

    Ok(())
}