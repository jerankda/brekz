import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../../types/chat";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}

function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const content = isStreaming ? (streamingContent ?? "") : message.content;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-primary" : "bg-code-bg"
        }`}
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Bot size={14} className="text-primary" />
        )}
      </div>

      <div className={`max-w-[640px] min-w-0 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-white rounded-tr-md"
              : "bg-surface border border-border text-text-primary rounded-tl-md"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-code-bg prose-pre:border prose-pre:border-border prose-code:text-text-primary prose-code:bg-code-bg prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-a:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || (isStreaming ? "" : "...")}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <span className="text-[10px] text-text-secondary font-mono">
              {message.model || (isStreaming ? "..." : "")}
            </span>
            {(message.input_tokens > 0 || message.output_tokens > 0) && (
              <span className="text-[10px] text-text-secondary font-mono">
                · {message.input_tokens}↑ {message.output_tokens}↓
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;