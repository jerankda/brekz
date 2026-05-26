import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { v4 as uuid } from "uuid";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import type { Message, StreamChunkPayload, StreamDonePayload, StreamErrorPayload } from "../types/chat";

export function useStreamingChat() {
  const {
    currentConversationId,
    messages,
    isStreaming,
    streamingContent,
    startStreaming,
    appendChunk,
    stopStreaming,
    addMessage,
    setError: setChatError,
  } = useChatStore();

  const { apiKey, defaultTemperature, defaultMaxTokens } = useSettingsStore();

  useEffect(() => {
    const unlistenChunk = listen<StreamChunkPayload>("stream-chunk", (event) => {
      appendChunk(event.payload.delta);
    });

    const unlistenDone = listen<StreamDonePayload>("stream-done", (event) => {
      const { content, model, input_tokens, output_tokens } = event.payload;
      const assistantMsg: Message = {
        id: uuid(),
        conversation_id: currentConversationId ?? "",
        role: "assistant",
        content,
        model,
        input_tokens,
        output_tokens,
        cost: 0,
        created_at: new Date().toISOString(),
      };
      addMessage(assistantMsg);
      stopStreaming();
    });

    const unlistenError = listen<StreamErrorPayload>("stream-error", (event) => {
      setChatError(event.payload.error);
    });

    return () => {
      unlistenChunk.then((f) => f());
      unlistenDone.then((f) => f());
      unlistenError.then((f) => f());
    };
  }, [currentConversationId, addMessage, appendChunk, stopStreaming, setChatError]);

  const sendMessage = useCallback(
    async (content: string, model: string) => {
      if (!apiKey || !currentConversationId || isStreaming) return;

      const userMsg: Message = {
        id: uuid(),
        conversation_id: currentConversationId,
        role: "user",
        content,
        model: "",
        input_tokens: 0,
        output_tokens: 0,
        cost: 0,
        created_at: new Date().toISOString(),
      };
      addMessage(userMsg);

      const assistantId = uuid();
      startStreaming(assistantId);

      const chatMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        await invoke("send_message", {
          apiKey,
          conversationId: currentConversationId,
          model,
          messages: chatMessages,
          settings: {
            temperature: defaultTemperature,
            max_tokens: defaultMaxTokens,
          },
        });
      } catch (e) {
        setChatError(String(e));
      }
    },
    [apiKey, currentConversationId, isStreaming, messages, defaultTemperature, defaultMaxTokens, addMessage, startStreaming, setChatError],
  );

  return { sendMessage, isStreaming, streamingContent };
}