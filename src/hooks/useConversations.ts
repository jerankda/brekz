import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../stores/chatStore";
import type { Conversation } from "../types/chat";

export function useConversations() {
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const setCurrentConversation = useChatStore((s) => s.setCurrentConversation);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);

  const createConversation = useCallback(async (model: string) => {
    const conv = await invoke<Conversation>("create_conversation", {
      title: "New Chat",
      model,
      systemPrompt: "",
    });
    setCurrentConversation(conv.id);
    setMessages([]);
    return conv;
  }, [setCurrentConversation, setMessages]);

  const loadConversation = useCallback(async (id: string) => {
    setCurrentConversation(id);
    try {
      const msgs = await invoke<Array<{
        id: string; conversation_id: string; role: string; content: string;
        model: string; input_tokens: number; output_tokens: number;
        cost: number; created_at: string;
      }>>("list_messages", { conversationId: id });
      setMessages(msgs.map((m) => ({
        ...m,
        role: m.role as "user" | "assistant" | "system",
      })));
    } catch {
      setMessages([]);
    }
  }, [setCurrentConversation, setMessages]);

  const loadConversations = useCallback(async () => {
    try {
      return await invoke<Conversation[]>("list_conversations");
    } catch {
      return [];
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await invoke("delete_conversation", { id });
    if (currentConversationId === id) {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [currentConversationId, setCurrentConversation, setMessages]);

  const saveMessage = useCallback(async (msg: {
    id: string; conversation_id: string; role: string; content: string;
    model: string; input_tokens: number; output_tokens: number;
    cost: number; created_at: string;
  }) => {
    await invoke("insert_message", { message: msg });
    addMessage({
      ...msg,
      role: msg.role as "user" | "assistant" | "system",
    });
  }, [addMessage]);

  return {
    createConversation,
    loadConversation,
    loadConversations,
    deleteConversation,
    saveMessage,
  };
}