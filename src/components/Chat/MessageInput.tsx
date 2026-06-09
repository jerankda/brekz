import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowUp, Paperclip, X, FileText, Image } from "lucide-react";
import { v4 as uuid } from "uuid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ModelSelector from "./ModelSelector";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { isMultimodalModel, getFileTypeCategory, ACCEPTED_MIME_TYPES, ACCEPTED_FILE_EXTENSIONS } from "../../lib/visionModels";
import type { FileAttachment } from "../../types/chat";

interface MessageInputProps {
  onSend: (content: string, model: string, files?: FileAttachment[]) => void
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function MessageInput({ onSend }: MessageInputProps) {
  const [input, setInput] = useState("");
  const isStreaming = useChatStore((s) => s.isStreaming);
  const pendingFiles = useChatStore((s) => s.pendingFiles);
  const addPendingFile = useChatStore((s) => s.addPendingFile);
  const removePendingFile = useChatStore((s) => s.removePendingFile);
  const clearPendingFiles = useChatStore((s) => s.clearPendingFiles);
  const { defaultModel, setDefaultModel } = useSettingsStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 8 * 24) + "px";
  }, []);

  const handleFiles = useCallback(async (fileList: FileList) => {
    const files: File[] = Array.from(fileList);
    for (const file of files) {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) continue;
      const data = await readFileAsBase64(file);
      addPendingFile({
        id: uuid(),
        name: file.name,
        mime_type: file.type,
        data,
        size: file.size,
      });
    }
  }, [addPendingFile]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if ((!trimmed && pendingFiles.length === 0) || isStreaming || !defaultModel) return;
    onSend(trimmed, defaultModel, pendingFiles.length > 0 ? pendingFiles : undefined);
    setInput("");
    clearPendingFiles();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isStreaming, defaultModel, onSend, pendingFiles, clearPendingFiles]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file" && ACCEPTED_MIME_TYPES.includes(item.type)) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length === 0) return;
    e.preventDefault();
    for (const file of files) {
      const data = await readFileAsBase64(file);
      addPendingFile({
        id: uuid(),
        name: file.name,
        mime_type: file.type,
        data,
        size: file.size,
      });
    }
  }, [addPendingFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const hasFiles = pendingFiles.length > 0;
  const showWarning = hasFiles && defaultModel && !isMultimodalModel(defaultModel);
  const canSend = (input.trim() || hasFiles) && !isStreaming && defaultModel;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="max-w-[720px] mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <ModelSelector value={defaultModel} onChange={setDefaultModel} />
        </div>

        {showWarning && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            Selected model may not support file uploads. Switch to a multimodal model (Claude, GPT-4o, Gemini) for best results.
          </div>
        )}

        {hasFiles && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingFiles.map((file) => {
              const category = getFileTypeCategory(file.mime_type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-1.5 bg-muted border border-border/40 rounded-lg px-2.5 py-1.5 text-xs group"
                >
                  {category === "image" ? (
                    <Image size={14} className="text-muted-foreground/60" />
                  ) : (
                    <FileText size={14} className="text-muted-foreground/60" />
                  )}
                  <span className="text-foreground/80 max-w-[120px] truncate">{file.name}</span>
                  <span className="text-muted-foreground/40">({formatSize(file.size)})</span>
                  <button
                    onClick={() => removePendingFile(file.id)}
                    className="ml-0.5 text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div
          className={`flex items-end gap-2 bg-card border rounded-2xl px-4 py-3 focus-within:border-border/80 focus-within:ring-1 focus-within:ring-border/20 transition-all duration-200 ${
            isDragOver ? "border-primary/50 bg-primary/5" : "border-border/40"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={hasFiles ? "Add a message..." : "Ask anything..."}
            rows={1}
            disabled={isStreaming}
            className="flex-1 border-0 bg-transparent px-0 py-0 min-h-0 resize-none text-base leading-relaxed placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_EXTENSIONS}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            size="icon"
            className="rounded-xl flex-shrink-0 size-9 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted border-0"
          >
            <Paperclip size={16} strokeWidth={2.5} />
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon"
            className="rounded-xl flex-shrink-0 size-9 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted border-0 disabled:opacity-30"
          >
            <ArrowUp size={17} strokeWidth={2.5} />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/30 text-center mt-2.5">
          brekz. can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

export default MessageInput;