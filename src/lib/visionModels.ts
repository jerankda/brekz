export const VISION_MODELS: Set<string> = new Set([
  // Anthropic Claude
  "anthropic/claude-3-haiku",
  "anthropic/claude-3-sonnet",
  "anthropic/claude-3-opus",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-opus",
  "anthropic/claude-4-haiku",
  "anthropic/claude-4-sonnet",
  "anthropic/claude-4-opus",

  // OpenAI GPT-4o
  "openai/gpt-4o",
  "openai/gpt-4o-2024-11-20",
  "openai/gpt-4o-mini",
  "openai/gpt-4o-mini-2024-07-18",
  "openai/o1",
  "openai/o1-mini",
  "openai/o3-mini",

  // Google Gemini
  "google/gemini-1.5-pro",
  "google/gemini-1.5-flash",
  "google/gemini-2.0-flash-001",
  "google/gemini-2.0-flash-lite-001",
  "google/gemini-2.0-pro-exp",
  "google/gemini-2.5-pro-exp",

  // Meta Llama Vision
  "meta-llama/llama-3.2-11b-vision",
  "meta-llama/llama-3.2-90b-vision",

  // Mistral
  "mistralai/pixtral-12b",
  "mistralai/pixtral-large-2411",

  // Amazon Nova
  "amazon/nova-pro-v1",
  "amazon/nova-lite-v1",
  "amazon/nova-micro-v1",

  // Other multimodal
  "cohere/command-r7b-12-2024",
  "deepseek/deepseek-vl2",
]);

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
const TEXT_MIMES = ["text/plain", "text/markdown", "text/csv", "text/html"];
const PDF_MIME = "application/pdf";

export const ACCEPTED_MIME_TYPES = [...IMAGE_MIMES, ...TEXT_MIMES, PDF_MIME];
export const ACCEPTED_FILE_EXTENSIONS = ".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.txt,.md,.csv,.html";

export function isMultimodalModel(modelId: string): boolean {
  return VISION_MODELS.has(modelId);
}

export function getFileTypeCategory(mimeType: string): "image" | "pdf" | "text" | "other" {
  if (IMAGE_MIMES.includes(mimeType)) return "image";
  if (mimeType === PDF_MIME) return "pdf";
  if (TEXT_MIMES.includes(mimeType)) return "text";
  return "other";
}

export function isImageMime(mimeType: string): boolean {
  return IMAGE_MIMES.includes(mimeType);
}

export function isTextMime(mimeType: string): boolean {
  return TEXT_MIMES.includes(mimeType);
}

export function isPdfMime(mimeType: string): boolean {
  return mimeType === PDF_MIME;
}