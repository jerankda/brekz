use serde::{Deserialize, Serialize};

// ── Model listing types ──

#[derive(Debug, Clone, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub context_length: u32,
    pub pricing: Pricing,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Pricing {
    pub prompt: f64,
    pub completion: f64,
}

#[derive(Debug, Serialize)]
pub struct ModelEntry {
    pub id: String,
    pub name: String,
    pub context_length: u32,
    pub prompt_pricing: f64,
    pub completion_pricing: f64,
}

impl From<ModelInfo> for ModelEntry {
    fn from(m: ModelInfo) -> Self {
        ModelEntry {
            id: m.id,
            name: m.name,
            context_length: m.context_length,
            prompt_pricing: m.pricing.prompt,
            completion_pricing: m.pricing.completion,
        }
    }
}

// ── File attachment types ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAttachment {
    pub id: String,
    pub name: String,
    pub mime_type: String,
    pub data: String,
    pub size: u64,
}

// ── Chat request types ──

#[derive(Debug, Serialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub stream: bool,
    pub temperature: f32,
    pub max_tokens: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream_options: Option<StreamOptions>,
}

#[derive(Debug, Serialize)]
pub struct StreamOptions {
    pub include_usage: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(untagged)]
pub enum ContentPart {
    Text {
        #[serde(rename = "type")]
        type_: String,
        text: String,
    },
    ImageUrl {
        #[serde(rename = "type")]
        type_: String,
        image_url: ImageUrl,
    },
}

impl ContentPart {
    pub fn text(text: String) -> Self {
        ContentPart::Text {
            type_: "text".to_string(),
            text,
        }
    }

    pub fn image_url(data_url: String) -> Self {
        ContentPart::ImageUrl {
            type_: "image_url".to_string(),
            image_url: ImageUrl { url: data_url },
        }
    }

    pub fn from_attachment(attachment: &FileAttachment) -> Self {
        let data_url = format!("data:{};base64,{}", attachment.mime_type, attachment.data);
        ContentPart::image_url(data_url)
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ImageUrl {
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<serde_json::Value>,
}

impl ChatMessage {
    pub fn plain(role: &str, content: &str) -> Self {
        ChatMessage {
            role: role.to_string(),
            content: Some(serde_json::Value::String(content.to_string())),
        }
    }

    pub fn with_parts(role: &str, text: &str, parts: Vec<ContentPart>) -> Self {
        let mut all_parts = Vec::new();
        if !text.is_empty() {
            all_parts.push(ContentPart::text(text.to_string()));
        }
        all_parts.extend(parts);
        ChatMessage {
            role: role.to_string(),
            content: Some(serde_json::to_value(all_parts).unwrap()),
        }
    }
}

// ── Chat response types (streaming JSON chunks) ──

#[derive(Debug, Deserialize)]
pub struct ChatResponse {
    pub choices: Vec<Choice>,
    pub usage: Option<Usage>,
}

#[derive(Debug, Deserialize)]
pub struct Choice {
    pub delta: Option<Delta>,
}

#[derive(Debug, Deserialize)]
pub struct Delta {
    pub content: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
}

// ── Database types ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub model: String,
    pub system_prompt: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub model: String,
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub cost: f64,
    pub created_at: String,
    pub attachments: String,
}

impl Message {
    pub fn to_chat_message(&self) -> ChatMessage {
        if self.attachments.is_empty() || self.attachments == "[]" {
            return ChatMessage::plain(&self.role, &self.content);
        }
        let files: Vec<FileAttachment> = serde_json::from_str(&self.attachments).unwrap_or_default();
        let parts: Vec<ContentPart> = files.iter().map(ContentPart::from_attachment).collect();
        ChatMessage::with_parts(&self.role, &self.content, parts)
    }
}

// ── Frontend-facing streaming event payloads ──

#[derive(Debug, Clone, Serialize)]
pub struct StreamChunkPayload {
    pub conversation_id: String,
    pub delta: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct StreamDonePayload {
    pub conversation_id: String,
    pub content: String,
    pub model: String,
    pub input_tokens: u32,
    pub output_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSettings {
    pub temperature: f32,
    pub max_tokens: u32,
}