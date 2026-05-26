use std::time::Duration;

use eventsource_stream::Eventsource;
use futures_util::StreamExt;
use reqwest::header;
use tauri::{Emitter, Runtime};

use crate::openrouter::types::{
    ChatMessage, ChatRequest, ChatResponse, ModelEntry, ModelsResponse, StreamChunkPayload,
    StreamDonePayload, Usage,
};

const BASE_URL: &str = "https://openrouter.ai/api/v1";
const REFERER: &str = "https://github.com/brekz-app";
const APP_TITLE: &str = "Brekz";

fn build_client(api_key: &str, read_timeout_secs: u64) -> reqwest::Client {
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
    headers.insert(
        header::CONTENT_TYPE,
        header::HeaderValue::from_static("application/json"),
    );

    reqwest::Client::builder()
        .default_headers(headers)
        .timeout(Duration::from_secs(read_timeout_secs))
        .build()
        .unwrap()
}

pub async fn validate_api_key(api_key: &str) -> Result<bool, String> {
    let client = build_client(api_key, 15);
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
    let client = build_client(api_key, 30);
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

pub async fn stream_chat<R: Runtime>(
    app: &impl Emitter<R>,
    api_key: &str,
    conversation_id: &str,
    model: &str,
    messages: &[ChatMessage],
    settings: &super::types::ChatSettings,
) -> Result<(), String> {
    let client = build_client(api_key, 300);
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