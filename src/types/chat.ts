export interface ModelEntry {
  id: string
  name: string
  context_length: number
  prompt_pricing: number
  completion_pricing: number
}

export type { AppSettings } from "./settings";