import { Plus, Settings, PanelLeftClose, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useConversations } from "../../hooks/useConversations";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Conversation } from "../../types/chat";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Sidebar() {
  const { openSettings, toggleSidebar } = useUIStore();
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const titleRefreshVersion = useChatStore((s) => s.titleRefreshVersion);
  const defaultModel = useSettingsStore((s) => s.defaultModel);
  const { createConversation, loadConversation, loadConversations, deleteConversation } = useConversations();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const refreshList = useCallback(async () => {
    const list = await loadConversations();
    setConversations(list);
  }, [loadConversations]);

  useEffect(() => {
    refreshList();
  }, [refreshList, titleRefreshVersion]);

  const handleNewChat = useCallback(async () => {
    await createConversation(defaultModel);
    await refreshList();
  }, [createConversation, refreshList, defaultModel]);

  const handleSelect = useCallback(async (id: string) => {
    if (id === currentConversationId) return;
    await loadConversation(id);
  }, [currentConversationId, loadConversation]);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    await refreshList();
  }, [deleteConversation, refreshList]);

  return (
    <aside className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="font-heading text-base font-medium tracking-tight text-sidebar-foreground">
          Brekz
        </h1>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
        >
          <PanelLeftClose size={14} />
        </Button>
      </header>

      <Separator />

      <div className="p-3">
        <Button onClick={handleNewChat} variant="outline" className="w-full gap-2 rounded-lg text-sm text-muted-foreground">
          <Plus size={14} />
          <span>New conversation</span>
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {conversations.length === 0 ? (
          <p className="text-muted-foreground/50 text-xs text-center py-12">
            No conversations yet
          </p>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <div key={conv.id} className="group relative">
                <button
                  onClick={() => handleSelect(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors duration-150",
                    conv.id === currentConversationId
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "truncate text-sm leading-snug",
                      conv.id === currentConversationId ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/80"
                    )}>
                      {conv.title || "New conversation"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {conv.model && (
                        <span className="text-[11px] font-mono text-sidebar-foreground/40 max-w-[110px] truncate">
                          {conv.model.split("/").pop()}
                        </span>
                      )}
                      {conv.model && <span className="text-[11px] text-sidebar-foreground/30">·</span>}
                      <span className="text-[11px] text-sidebar-foreground/40 whitespace-nowrap">
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className={cn(
                    "absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100",
                    "w-6 h-6 rounded-md flex items-center justify-center",
                    "text-sidebar-foreground/30 hover:text-destructive hover:bg-destructive/10",
                    "transition-all duration-150"
                  )}
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </nav>

      <Separator />

      <footer className="p-3">
        <Button
          variant="ghost"
          onClick={() => openSettings()}
          className="w-full justify-start gap-2 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground"
        >
          <Settings size={14} />
          <span>Settings</span>
        </Button>
      </footer>
    </aside>
  );
}

export default Sidebar;