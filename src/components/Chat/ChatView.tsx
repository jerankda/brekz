import { MessageSquare } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import ModelSelector from "./ModelSelector";

function ChatView() {
  const { defaultModel, setDefaultModel } = useSettingsStore();

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
            Select a model, type your message, and press{" "}
            <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-code-bg border border-border">
              ⌘Enter
            </kbd>{" "}
            to send.
          </p>
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="max-w-[768px] mx-auto w-full space-y-3">
          <div className="w-full max-w-[280px]">
            <ModelSelector value={defaultModel} onChange={setDefaultModel} />
          </div>
          <div className="flex items-end gap-2 bg-surface border border-border rounded-xl px-4 py-3">
            <textarea
              placeholder="Send a message..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-text-primary text-sm font-body leading-relaxed placeholder:text-text-secondary"
            />
            <button className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors cursor-pointer flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatView;