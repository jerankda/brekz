export interface ModelEntry {
  id: string
  name: string
  context_length: number
  prompt_pricing: number
  completion_pricing: number
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  model: string
  input_tokens: number
  output_tokens: number
  cost: number
  created_at: string
}

export interface Conversation {
  id: string
  title: string
  model: string
  system_prompt: string
  created_at: string
  updated_at: string
}

export interface StreamChunkPayload {
  conversation_id: string
  delta: string
}

export interface StreamDonePayload {
  conversation_id: string
  content: string
  model: string
  input_tokens: number
  output_tokens: number
}

export interface StreamErrorPayload {
  conversation_id: string
  error: string
}

export type { AppSettings } from "./settings";