import { useState, useRef, useCallback } from "react";
import { ArrowUp } from "lucide-react";
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
    el.style.height = Math.min(el.scrollHeight, 8 * 20) + "px";
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
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="border-t border-border p-4">
      <div className="max-w-[768px] mx-auto w-full space-y-3">
        <div className="w-full max-w-[280px]">
          <ModelSelector value={defaultModel} onChange={setDefaultModel} />
        </div>

        <div className="flex items-end gap-2 bg-surface border border-border rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent border-none outline-none resize-none text-text-primary text-sm font-body leading-relaxed placeholder:text-text-secondary disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || !defaultModel}
            className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex-shrink-0"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessageInput;