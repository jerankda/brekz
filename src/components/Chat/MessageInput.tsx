import { useState, useRef, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ModelSelector from "./ModelSelector";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";

interface MessageInputProps {
  onSend: (content: string, model: string) => void
}

function MessageInput({ onSend }: MessageInputProps) {
  const [input, setInput] = useState("");
  const isStreaming = useChatStore((s) => s.isStreaming);
  const { defaultModel, setDefaultModel } = useSettingsStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 8 * 24) + "px";
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !defaultModel) return;
    onSend(trimmed, defaultModel);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isStreaming, defaultModel, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const canSend = input.trim() && !isStreaming && defaultModel;

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="max-w-[720px] mx-auto w-full">
        <div className="w-full max-w-[260px] mb-3">
          <ModelSelector value={defaultModel} onChange={setDefaultModel} />
        </div>

        <div className="flex items-end gap-2 bg-card border border-border/40 rounded-2xl px-4 py-3 shadow-2xl shadow-black/30 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 border-0 bg-transparent px-0 py-0 min-h-0 resize-none text-[15px] leading-relaxed placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon"
            className="rounded-xl flex-shrink-0 size-9"
          >
            <ArrowUp size={17} strokeWidth={2.5} />
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground/50 text-center mt-2.5">
          Brekz can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

export default MessageInput;