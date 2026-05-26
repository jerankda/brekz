import { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../stores/settingsStore";
import { useModelStore } from "../stores/modelStore";
import type { ModelEntry } from "../types/chat";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function useModels() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const { models, loading, error, lastFetch, setModels, setLoading, setError } = useModelStore();

  const fetchModels = useCallback(async (key?: string) => {
    const effectiveKey = key ?? apiKey;
    if (!effectiveKey) return;

    setLoading(true);
    try {
      const data = await invoke<ModelEntry[]>("fetch_models", { apiKey: effectiveKey });
      setModels(data);
    } catch (e) {
      setError(String(e));
    }
  }, [apiKey, setModels, setLoading, setError]);

  useEffect(() => {
    if (!apiKey || models.length > 0) return;

    if (lastFetch && Date.now() - lastFetch < CACHE_TTL) return;

    fetchModels();
  }, [apiKey, fetchModels, models.length, lastFetch]);

  return { models, loading, error, refreshModels: () => fetchModels() };
}