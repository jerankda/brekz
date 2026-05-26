import { useCallback } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useConversations } from "../../hooks/useConversations";
import { useStreamingChat } from "../../hooks/useStreamingChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

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
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={28} className="text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-3">
            Welcome to Brekz
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Add your OpenRouter API key in Settings to start chatting.
          </p>
        </div>
      </div>
    );
  }

  if (!apiKeyValid) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={28} className="text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-3">
            Validate your API key
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Go to Settings and click "Validate" to verify your key.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {messages.length === 0 && !isStreaming ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={28} className="text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-text-primary mb-3">
              Start a conversation
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Select a model, type your message, and press{" "}
              <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-code-bg border border-border">
                ⌘Enter
              </kbd>{" "}
              to send.
            </p>
          </div>
        </div>
      ) : (
        <MessageList />
      )}

      {error && (
        <div className="px-4 py-2 mx-4 mb-2 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
          {error}
        </div>
      )}

      {isStreaming && messages.length > 0 && (
        <div className="px-4 py-1 flex items-center gap-2 text-text-secondary text-xs">
          <Loader2 size={12} className="animate-spin" />
          Generating response...
        </div>
      )}

      <MessageInput onSend={handleSend} />
    </div>
  );
}

export default ChatView;