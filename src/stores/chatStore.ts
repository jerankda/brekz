import { create } from "zustand";
import type { Message } from "../types/chat";

interface ChatState {
  currentConversationId: string | null
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
  streamingMessageId: string | null
  error: string | null

  setCurrentConversation: (id: string | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  startStreaming: (messageId: string) => void
  appendChunk: (chunk: string) => void
  stopStreaming: () => void
  setError: (error: string | null) => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  streamingMessageId: null,
  error: null,

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
}));