import { create } from "zustand";
import { Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";
import type { AppSettings } from "../types/settings";
import type { ModelEntry } from "../types/chat";
import { useModelStore } from "./modelStore";

interface SettingsState extends AppSettings {
  loaded: boolean

  load: () => Promise<void>
  setApiKey: (key: string | null) => Promise<void>
  setApiKeyValid: (valid: boolean) => void
  setDefaultModel: (model: string) => Promise<void>
  setDefaultTemperature: (temp: number) => Promise<void>
  setDefaultMaxTokens: (tokens: number) => Promise<void>
  setDefaultSystemPrompt: (prompt: string) => Promise<void>
  setDarkMode: (dark: boolean) => Promise<void>
}

let storeInstance: Store | null = null;

async function getStore(): Promise<Store> {
  if (!storeInstance) {
    storeInstance = await Store.load("settings.json");
  }
  return storeInstance;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: null,
  apiKeyValid: false,
  defaultModel: "",
  defaultTemperature: 0.7,
  defaultMaxTokens: 4096,
  defaultSystemPrompt: "",
  darkMode: false,
  loaded: false,

  load: async () => {
    const store = await getStore();
    const apiKey = await store.get<string>("apiKey");
    const defaultModel = await store.get<string>("defaultModel");
    const defaultTemperature = await store.get<number>("defaultTemperature");
    const defaultMaxTokens = await store.get<number>("defaultMaxTokens");
    const defaultSystemPrompt = await store.get<string>("defaultSystemPrompt");
    const darkMode = await store.get<boolean>("darkMode");

    set({
      apiKey: apiKey ?? null,
      defaultModel: defaultModel ?? "",
      defaultTemperature: defaultTemperature ?? 0.7,
      defaultMaxTokens: defaultMaxTokens ?? 4096,
      defaultSystemPrompt: defaultSystemPrompt ?? "",
      darkMode: darkMode ?? false,
      loaded: true,
    });

    if (apiKey) {
      try {
        const valid = await invoke<boolean>("validate_api_key", { apiKey });
        set({ apiKeyValid: valid });
        if (valid) {
          const models = await invoke<ModelEntry[]>("fetch_models", { apiKey });
          useModelStore.getState().setModels(models);
          if (!defaultModel && models.length > 0) {
            await store.set("defaultModel", models[0].id);
            await store.save();
            set({ defaultModel: models[0].id });
          }
        }
      } catch {
        set({ apiKeyValid: false });
      }
    }
  },

  setApiKey: async (key) => {
    const store = await getStore();
    if (key) {
      await store.set("apiKey", key);
    } else {
      await store.delete("apiKey");
    }
    await store.save();
    set((s) => ({ apiKey: key, apiKeyValid: key === s.apiKey ? s.apiKeyValid : false }));
  },

  setApiKeyValid: (valid) => set({ apiKeyValid: valid }),

  setDefaultModel: async (model) => {
    const store = await getStore();
    await store.set("defaultModel", model);
    await store.save();
    set({ defaultModel: model });
  },

  setDefaultTemperature: async (temp) => {
    const store = await getStore();
    await store.set("defaultTemperature", temp);
    await store.save();
    set({ defaultTemperature: temp });
  },

  setDefaultMaxTokens: async (tokens) => {
    const store = await getStore();
    await store.set("defaultMaxTokens", tokens);
    await store.save();
    set({ defaultMaxTokens: tokens });
  },

  setDefaultSystemPrompt: async (prompt) => {
    const store = await getStore();
    await store.set("defaultSystemPrompt", prompt);
    await store.save();
    set({ defaultSystemPrompt: prompt });
  },

  setDarkMode: async (dark) => {
    const store = await getStore();
    await store.set("darkMode", dark);
    await store.save();
    set({ darkMode: dark });
  },
}));