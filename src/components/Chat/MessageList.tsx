import { useRef, useEffect, useCallback } from "react";
import { useChatStore } from "../../stores/chatStore";
import MessageBubble from "./MessageBubble";

function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUp.current = distFromBottom > 80;
  }, []);

  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-8"
    >
      <div className="max-w-[680px] mx-auto flex flex-col gap-8">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <MessageBubble
            message={{
              id: "streaming",
              conversation_id: "",
              role: "assistant",
              content: "",
              model: "",
              input_tokens: 0,
              output_tokens: 0,
              cost: 0,
              created_at: "",
            }}
            isStreaming
            streamingContent={streamingContent}
          />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default MessageList;