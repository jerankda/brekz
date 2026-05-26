import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../../types/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}

function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const content = isStreaming ? (streamingContent ?? "") : message.content;
  const isEmpty = !content && isStreaming;

  return (
    <div
      className={cn(
        "flex gap-4 animate-fade-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar size="sm">
        <AvatarFallback
          className={cn(
            "text-[10px] font-semibold",
            isUser
              ? "bg-primary/15 text-primary ring-1 ring-primary/20"
              : "bg-muted text-muted-foreground border border-border"
          )}
        >
          {isUser ? "Y" : "AI"}
        </AvatarFallback>
      </Avatar>

      <div className={cn("max-w-[640px] min-w-0 flex flex-col", isUser ? "items-end" : "items-start")}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-md px-5 py-3 bg-secondary/60 text-[15px] leading-relaxed text-foreground">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="text-[15px] leading-relaxed text-foreground prose prose-neutral dark:prose-invert max-w-none">
            {isEmpty ? (
              <div className="flex items-center gap-1.5 py-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" style={{ animationDelay: "0.15s" }} />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" style={{ animationDelay: "0.3s" }} />
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            )}
          </div>
        )}

        {!isUser && !isEmpty && (
          <div className="flex items-center gap-2 mt-1.5">
            {message.model && (
              <span className="text-[11px] text-muted-foreground/60 font-mono">
                {message.model.split("/").pop()}
              </span>
            )}
            {(message.input_tokens > 0 || message.output_tokens > 0) && (
              <span className="text-[11px] text-muted-foreground/60 font-mono">
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