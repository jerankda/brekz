import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean
  settingsOpen: boolean
  settingsTab: "general" | "models" | "data"

  toggleSidebar: () => void
  openSettings: (tab?: string) => void
  closeSettings: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  settingsOpen: false,
  settingsTab: "general",

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSettings: (tab) => set({ settingsOpen: true, settingsTab: (tab as UIState["settingsTab"]) ?? "general" }),
  closeSettings: () => set({ settingsOpen: false }),
}));