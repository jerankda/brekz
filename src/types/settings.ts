export interface AppSettings {
  apiKey: string | null
  apiKeyValid: boolean
  defaultModel: string
  defaultTemperature: number
  defaultMaxTokens: number
  defaultSystemPrompt: string
  darkMode: boolean
}