import { useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { v4 as uuid } from "uuid";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useConversations } from "./useConversations";
import type { StreamChunkPayload, StreamDonePayload, FileAttachment } from "../types/chat";

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
    clearPendingFiles,
  } = useChatStore();

  const { apiKey, defaultTemperature, defaultMaxTokens, defaultSystemPrompt } = useSettingsStore();
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
        attachments: "[]",
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
          .catch(() => bumpTitleRefresh());
      } else {
        bumpTitleRefresh();
      }
    });

    return () => {
      unlistenChunk.then((f) => f());
      unlistenDone.then((f) => f());
    };
  }, [saveMessage, addMessage, appendChunk, stopStreaming, setChatError, apiKey, bumpTitleRefresh]);

  const sendMessage = useCallback(
    async (content: string, model: string, convId?: string, files?: FileAttachment[]) => {
      const id = convId ?? currentConversationId;
      if (!apiKey || !id || isStreaming) return;

      const attachmentsJson = files && files.length > 0 ? JSON.stringify(files) : "[]";

      const userMsg = {
        id: uuid(),
        conversation_id: id,
        role: "user" as const,
        content,
        attachments: attachmentsJson,
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
        firstUserMessage.current = content || (files && files.length > 0 ? "[File attachment]" : "");
      }

      const assistantId = uuid();
      startStreaming(assistantId);

      const store = useChatStore.getState();
      const chatMessages: { role: string; content: string }[] = [];
      if (defaultSystemPrompt) {
        chatMessages.push({ role: "system", content: defaultSystemPrompt });
      }
      for (const m of store.messages) {
        chatMessages.push({ role: m.role, content: m.content });
      }

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
          files: files && files.length > 0 ? files : null,
        });
      } catch (e) {
        setChatError(String(e));
      }

      clearPendingFiles();
    },
    [apiKey, isStreaming, defaultTemperature, defaultMaxTokens, defaultSystemPrompt, saveMessage, addMessage, startStreaming, setChatError, clearPendingFiles],
  );

  return { sendMessage, isStreaming };
}