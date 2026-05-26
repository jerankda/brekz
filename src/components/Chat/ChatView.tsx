import { useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { v4 as uuid } from "uuid";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useStreamingChat } from "../../hooks/useStreamingChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

function ChatView() {
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const setCurrentConversation = useChatStore((s) => s.setCurrentConversation);
  const messages = useChatStore((s) => s.messages);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const defaultModel = useSettingsStore((s) => s.defaultModel);

  const { sendMessage } = useStreamingChat();

  const handleSend = useCallback(
    (content: string, model: string) => {
      if (!currentConversationId) {
        setCurrentConversation(uuid());
      }
      sendMessage(content, model);
    },
    [currentConversationId, setCurrentConversation, sendMessage],
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

  if (!defaultModel) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={28} className="text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-3">
            Select a model
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Choose a model above the input to start talking.
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={28} className="text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-text-primary mb-3">
              Start a conversation
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Type your message and press{" "}
              <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-code-bg border border-border">
                ⌘Enter
              </kbd>{" "}
              to send.
            </p>
          </div>
        </div>
        <MessageInput onSend={handleSend} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <MessageList />
      <MessageInput onSend={handleSend} />
    </div>
  );
}

export default ChatView;