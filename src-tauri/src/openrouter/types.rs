use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ModelsResponse {
    pub data: Vec<ModelInfo>,
}

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

#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub stream: bool,
    pub temperature: f32,
    pub max_tokens: u32,
}

#[derive(Debug, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatResponse {
    pub choices: Vec<Choice>,
    pub usage: Option<Usage>,
}

#[derive(Debug, Deserialize)]
pub struct Choice {
    pub delta: Option<Delta>,
    pub message: Option<Message>,
}

#[derive(Debug, Deserialize)]
pub struct Delta {
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Message {
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, serde::Serialize)]
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