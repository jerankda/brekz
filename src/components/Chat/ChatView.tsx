import { useCallback, useEffect, useRef } from "react";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useConversations } from "../../hooks/useConversations";
import { useStreamingChat } from "../../hooks/useStreamingChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center px-8">
      <div className="text-center max-w-md animate-fade-up">
        <h2 className="font-heading text-2xl font-light text-foreground/80 mb-3 tracking-tight">
          {title}
        </h2>
        <div className="text-muted-foreground/70 text-base leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function ChatView() {
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const error = useChatStore((s) => s.error);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const apiKeyValid = useSettingsStore((s) => s.apiKeyValid);
  const defaultModel = useSettingsStore((s) => s.defaultModel);

  const { createConversation } = useConversations();
  const { sendMessage } = useStreamingChat();

  const prevValidRef = useRef(apiKeyValid);
  const creatingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (apiKeyValid && !prevValidRef.current && !currentConversationId && defaultModel && !creatingRef.current) {
      creatingRef.current = true;
      createConversation(defaultModel).finally(() => {
        if (mountedRef.current) creatingRef.current = false;
      });
    }
    prevValidRef.current = apiKeyValid;
  }, [apiKeyValid, currentConversationId, defaultModel, createConversation]);

  const handleSend = useCallback(
    async (content: string, model: string) => {
      let convId = currentConversationId;
      if (!convId && !creatingRef.current) {
        const conv = await createConversation(model);
        convId = conv.id;
      }
      if (!convId) return;
      sendMessage(content, model);
    },
    [currentConversationId, createConversation, sendMessage],
  );

  if (!apiKey) {
    return (
      <EmptyState title="Welcome to Brekz">
        Add your OpenRouter API key in Settings to start chatting with any AI model.
      </EmptyState>
    );
  }

  if (!apiKeyValid) {
    return (
      <EmptyState title="Validate your API key">
        Go to <span className="text-foreground font-medium">Settings</span> and click Validate to verify your key.
      </EmptyState>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {messages.length === 0 && !isStreaming ? (
        <EmptyState title="What can I help with?">
          Select a model and type your message.
        </EmptyState>
      ) : (
        <MessageList />
      )}

      {error && (
        <div className="mx-auto max-w-[680px] w-full px-4 pb-2">
          <div className="px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-fade-up">
            {error}
          </div>
        </div>
      )}

      <MessageInput onSend={handleSend} />
    </div>
  );
}

export default ChatView;