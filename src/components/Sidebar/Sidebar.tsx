import { Plus, Search, Settings, MessageSquare } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useChatStore } from "../../stores/chatStore";
import { useConversations } from "../../hooks/useConversations";
import { useSettingsStore } from "../../stores/settingsStore";
import type { Conversation } from "../../types/chat";

function Sidebar() {
  const openSettings = useUIStore((s) => s.openSettings);
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const defaultModel = useSettingsStore((s) => s.defaultModel);
  const { createConversation, loadConversation, loadConversations, deleteConversation } = useConversations();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  const refreshList = useCallback(async () => {
    const list = await loadConversations();
    setConversations(list);
  }, [loadConversations]);

  useEffect(() => {
    refreshList();
  }, [refreshList, currentConversationId]);

  const handleNewChat = useCallback(async () => {
    if (!defaultModel) return;
    await createConversation(defaultModel);
    await refreshList();
  }, [defaultModel, createConversation, refreshList]);

  const handleSelect = useCallback(async (id: string) => {
    if (id === currentConversationId) return;
    await loadConversation(id);
  }, [currentConversationId, loadConversation]);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    await refreshList();
  }, [deleteConversation, refreshList]);

  const filtered = search
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <aside className="w-[280px] h-full flex flex-col bg-surface border-r border-border flex-shrink-0">
      <div className="p-4 border-b border-border">
        <button
          onClick={handleNewChat}
          disabled={!defaultModel}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg text-text-secondary text-sm">
          <Search size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="bg-transparent border-none outline-none text-text-primary text-sm w-full"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 ? (
          <p className="text-text-secondary text-xs px-3 py-2 font-medium">
            {search ? "No matching conversations" : "No conversations yet"}
          </p>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                conv.id === currentConversationId
                  ? "bg-primary-light text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg"
              }`}
            >
              <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`truncate text-sm font-medium ${
                  conv.id === currentConversationId ? "text-primary" : "text-text-primary"
                }`}>
                  {conv.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {conv.model && (
                    <span className="text-[10px] font-mono truncate text-text-secondary">
                      {conv.model.split("/").pop()}
                    </span>
                  )}
                  <span className="text-[10px] text-text-secondary">·</span>
                  <span className="text-[10px] text-text-secondary">{formatTime(conv.updated_at)}</span>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-text-secondary hover:text-error transition-opacity flex-shrink-0 mt-0.5 cursor-pointer"
                title="Delete conversation"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </button>
          ))
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => openSettings()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors text-sm cursor-pointer"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;