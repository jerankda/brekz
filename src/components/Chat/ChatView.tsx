import { useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useModelStore } from "../../stores/modelStore";
import { useConversations } from "../../hooks/useConversations";
import { useStreamingChat } from "../../hooks/useStreamingChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import type { FileAttachment } from "../../types/chat";

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
  const clearError = useChatStore((s) => s.clearError);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const apiKeyValid = useSettingsStore((s) => s.apiKeyValid);

  const { createConversation } = useConversations();
  const { sendMessage } = useStreamingChat();

  const handleSend = useCallback(
    async (content: string, model: string, files?: FileAttachment[]) => {
      let convId = currentConversationId;
      if (!convId) {
        const conv = await createConversation(model);
        convId = conv.id;
      }
      if (!convId) return;
      sendMessage(content, model, convId, files);
    },
    [currentConversationId, createConversation, sendMessage],
  );

  const models = useModelStore((s) => s.models);

  const tokenStats = useMemo(() => {
    const pricingMap = new Map(models.map((m) => [m.id, m]));
    let inputTokens = 0;
    let outputTokens = 0;
    let cost = 0;
    for (const m of messages) {
      inputTokens += m.input_tokens;
      outputTokens += m.output_tokens;
      if (m.model) {
        const pricing = pricingMap.get(m.model);
        if (pricing) {
          cost += m.input_tokens * pricing.prompt_pricing + m.output_tokens * pricing.completion_pricing;
        }
      }
    }
    return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, cost };
  }, [messages, models]);

  if (!apiKey) {
    return (
      <EmptyState title="Welcome to brekz.">
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

      {tokenStats.totalTokens > 0 && (
        <div className="mx-auto max-w-[680px] w-full px-4 pb-1">
          <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-muted-foreground/40">
            <span>{tokenStats.inputTokens.toLocaleString()} input</span>
            <span className="text-muted-foreground/20">·</span>
            <span>{tokenStats.outputTokens.toLocaleString()} output</span>
            <span className="text-muted-foreground/20">·</span>
            <span>{tokenStats.totalTokens.toLocaleString()} total</span>
            <span className="text-muted-foreground/20">·</span>
            <span>${tokenStats.cost < 0.01 ? tokenStats.cost.toFixed(4) : tokenStats.cost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-[680px] w-full px-4 pb-2">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-fade-up">
            <span className="flex-1">{error}</span>
            <button
              onClick={clearError}
              className="ml-1 flex-shrink-0 text-destructive/50 hover:text-destructive transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <MessageInput onSend={handleSend} />
    </div>
  );
}

export default ChatView;