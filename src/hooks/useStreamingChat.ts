import { useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { v4 as uuid } from "uuid";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useConversations } from "./useConversations";
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
  const { saveMessage, setConversationTitle } = useConversations();
  const hasSentFirstMessage = useRef(false);

  useEffect(() => {
    const unlistenChunk = listen<StreamChunkPayload>("stream-chunk", (event) => {
      appendChunk(event.payload.delta);
    });

    const unlistenDone = listen<StreamDonePayload>("stream-done", async (event) => {
      const { conversation_id, content, model, input_tokens, output_tokens } = event.payload;
      const assistantMsg = {
        id: uuid(),
        conversation_id,
        role: "assistant" as const,
        content,
        model,
        input_tokens,
        output_tokens,
        cost: 0,
        created_at: new Date().toISOString(),
      };
      try {
        await saveMessage(assistantMsg);
      } catch {
        addMessage(assistantMsg);
      }
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
  }, [saveMessage, addMessage, appendChunk, stopStreaming, setChatError]);

  const sendMessage = useCallback(
    async (content: string, model: string) => {
      if (!apiKey || !currentConversationId || isStreaming) return;

      const userMsg = {
        id: uuid(),
        conversation_id: currentConversationId,
        role: "user" as const,
        content,
        model: "",
        input_tokens: 0,
        output_tokens: 0,
        cost: 0,
        created_at: new Date().toISOString(),
      };

      try {
        await saveMessage(userMsg);
      } catch {
        addMessage(userMsg);
      }

      if (!hasSentFirstMessage.current) {
        hasSentFirstMessage.current = true;
        const title = content.length > 50 ? content.slice(0, 50) + "…" : content;
        try {
          await setConversationTitle(currentConversationId, title);
        } catch {
          // non-critical
        }
      }

      const assistantId = uuid();
      startStreaming(assistantId);

      const store = useChatStore.getState();
      const chatMessages = store.messages.map((m: Message) => ({
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
    [apiKey, currentConversationId, isStreaming, messages, defaultTemperature, defaultMaxTokens, saveMessage, addMessage, startStreaming, setChatError, setConversationTitle],
  );

  return { sendMessage, isStreaming, streamingContent };
}