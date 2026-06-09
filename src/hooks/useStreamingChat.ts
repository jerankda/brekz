import { useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { v4 as uuid } from "uuid";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useConversations } from "./useConversations";
import type { Message, StreamChunkPayload, StreamDonePayload } from "../types/chat";

export function useStreamingChat() {
  const {
    currentConversationId,
    isStreaming,
    startStreaming,
    appendChunk,
    stopStreaming,
    addMessage,
    setError: setChatError,
    bumpTitleRefresh,
  } = useChatStore();

  const { apiKey, defaultTemperature, defaultMaxTokens } = useSettingsStore();
  const { saveMessage } = useConversations();
  const hasSentFirstMessage = useRef(false);
  const firstUserMessage = useRef("");

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

      if (firstUserMessage.current && apiKey) {
        invoke("generate_conversation_title", {
          apiKey,
          conversationId: conversation_id,
          userMessage: firstUserMessage.current,
          assistantMessage: content,
        })
          .then(() => bumpTitleRefresh())
          .catch(() => {});
      }
    });

    return () => {
      unlistenChunk.then((f) => f());
      unlistenDone.then((f) => f());
    };
  }, [saveMessage, addMessage, appendChunk, stopStreaming, setChatError, apiKey, bumpTitleRefresh]);

  const sendMessage = useCallback(
    async (content: string, model: string, convId?: string) => {
      const id = convId ?? currentConversationId;
      if (!apiKey || !id || isStreaming) return;

      const userMsg = {
        id: uuid(),
        conversation_id: id,
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
        firstUserMessage.current = content;
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
          conversationId: id,
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
    [apiKey, isStreaming, defaultTemperature, defaultMaxTokens, saveMessage, addMessage, startStreaming, setChatError],
  );

  return { sendMessage, isStreaming };
}