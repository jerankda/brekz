import { useCallback } from "react";
import { MessageSquare, Loader2, Sparkles } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useConversations } from "../../hooks/useConversations";
import { useStreamingChat } from "../../hooks/useStreamingChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

function EmptyState({ icon: Icon, title, children }: { icon: typeof Sparkles; title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center px-8">
      <div className="text-center max-w-md animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-8">
          <Icon size={26} className="text-primary" />
        </div>
        <h2 className="font-heading text-[26px] font-semibold text-foreground mb-4 tracking-tight">
          {title}
        </h2>
        <div className="text-muted-foreground text-[15px] leading-relaxed">
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

  const { createConversation } = useConversations();
  const { sendMessage } = useStreamingChat();

  const handleSend = useCallback(
    async (content: string, model: string) => {
      let convId = currentConversationId;
      if (!convId) {
        const conv = await createConversation(model);
        convId = conv.id;
      }
      sendMessage(content, model);
    },
    [currentConversationId, createConversation, sendMessage],
  );

  if (!apiKey) {
    return (
      <EmptyState icon={MessageSquare} title="Welcome to Brekz">
        Add your OpenRouter API key in Settings to start chatting with any AI model.
      </EmptyState>
    );
  }

  if (!apiKeyValid) {
    return (
      <EmptyState icon={MessageSquare} title="Validate your API key">
        Go to <span className="text-foreground font-medium">Settings</span> and click Validate to verify your key.
      </EmptyState>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40">
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
            <Loader2 size={11} className="animate-spin" />
            Streaming...
          </span>
        )}
      </div>

      {messages.length === 0 && !isStreaming ? (
        <EmptyState icon={Sparkles} title="What can I help with?">
          Select a model below, then type your message.
        </EmptyState>
      ) : (
        <MessageList />
      )}

      {error && (
        <div className="mx-auto max-w-[720px] w-full px-4 pb-2">
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