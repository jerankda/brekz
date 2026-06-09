import { create } from "zustand";
import type { Message, FileAttachment } from "../types/chat";

interface ChatState {
  currentConversationId: string | null
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
  streamingMessageId: string | null
  error: string | null
  titleRefreshVersion: number
  pendingFiles: FileAttachment[]

  setCurrentConversation: (id: string | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  startStreaming: (messageId: string) => void
  appendChunk: (chunk: string) => void
  stopStreaming: () => void
  setError: (error: string | null) => void
  bumpTitleRefresh: () => void
  addPendingFile: (file: FileAttachment) => void
  removePendingFile: (id: string) => void
  clearPendingFiles: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  streamingMessageId: null,
  error: null,
  titleRefreshVersion: 0,
  pendingFiles: [],

  setCurrentConversation: (id) => set({ currentConversationId: id }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),

  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  startStreaming: (messageId) =>
    set({
      isStreaming: true,
      streamingContent: "",
      streamingMessageId: messageId,
      error: null,
    }),

  appendChunk: (chunk) =>
    set((s) => ({ streamingContent: s.streamingContent + chunk })),

  stopStreaming: () =>
    set({
      isStreaming: false,
      streamingContent: "",
      streamingMessageId: null,
    }),

  setError: (error) => set({ error, isStreaming: false }),

  bumpTitleRefresh: () =>
    set((s) => ({ titleRefreshVersion: s.titleRefreshVersion + 1 }),
  ),

  addPendingFile: (file) =>
    set((s) => ({ pendingFiles: [...s.pendingFiles, file] })),

  removePendingFile: (id) =>
    set((s) => ({ pendingFiles: s.pendingFiles.filter((f) => f.id !== id) })),

  clearPendingFiles: () => set({ pendingFiles: [] }),
}));