import { create } from "zustand";
import type { ModelEntry } from "../types/chat";

interface ModelsState {
  models: ModelEntry[]
  loading: boolean
  error: string | null
  lastFetch: number | null

  setModels: (models: ModelEntry[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useModelStore = create<ModelsState>((set) => ({
  models: [],
  loading: false,
  error: null,
  lastFetch: null,

  setModels: (models) => set({ models, error: null, lastFetch: Date.now() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));