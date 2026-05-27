import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../../types/chat";
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
      <div className={cn("max-w-[680px] min-w-0 flex flex-col", isUser ? "items-end" : "items-start")}>
        {isUser ? (
          <div className="rounded-2xl px-5 py-3 bg-secondary/80 text-[16px] leading-relaxed text-foreground/90">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="text-[16px] leading-relaxed text-foreground/85 prose prose-neutral dark:prose-invert max-w-none
            [&_p]:leading-relaxed [&_p]:my-3
            [&_h1]:text-xl [&_h1]:font-heading [&_h1]:mt-8 [&_h1]:mb-4
            [&_h2]:text-lg [&_h2]:font-heading [&_h2]:mt-6 [&_h2]:mb-3
            [&_h3]:text-base [&_h3]:font-heading [&_h3]:mt-5 [&_h3]:mb-2
            [&_ul]:my-3 [&_ol]:my-3
            [&_li]:my-1
            [&_code]:text-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
            [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:my-4 [&_pre]:border [&_pre]:border-border/50
            [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
            [&_hr]:border-border/50 [&_hr]:my-6
            [&_a]:text-foreground/70 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-muted-foreground/30 [&_a:hover]:decoration-foreground/60
          ">
            {isEmpty ? (
              <div className="flex items-center gap-1.5 py-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0.15s" }} />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0.3s" }} />
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            )}
          </div>
        )}

        {!isUser && !isEmpty && (
          <div className="flex items-center gap-2 mt-3">
            {message.model && (
              <span className="text-xs text-muted-foreground/50 font-mono">
                {message.model.split("/").pop()}
              </span>
            )}
            {(message.input_tokens > 0 || message.output_tokens > 0) && (
              <span className="text-xs text-muted-foreground/50 font-mono">
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