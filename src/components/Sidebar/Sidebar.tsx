import { Plus, Search, Settings, MessageSquare, PanelLeftClose, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useChatStore } from "../../stores/chatStore";
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
  const { createConversation, loadConversation, loadConversations, deleteConversation } = useConversations();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  const refreshList = useCallback(async () => {
    const list = await loadConversations();
    setConversations(list);
  }, [loadConversations]);

  useEffect(() => {
    refreshList();
  }, [refreshList, currentConversationId, titleRefreshVersion]);

  const handleNewChat = useCallback(async () => {
    await createConversation("");
    await refreshList();
  }, [createConversation, refreshList]);

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

  return (
    <aside className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="font-heading text-[17px] font-semibold tracking-tight">
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

      <div className="p-3 space-y-2">
        <Button onClick={handleNewChat} className="w-full gap-2 rounded-lg">
          <Plus size={15} />
          <span>New Chat</span>
        </Button>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground text-sm border border-transparent focus-within:border-border transition-colors duration-200">
          <Search size={13} className="flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="bg-transparent border-none outline-none text-foreground text-sm w-full placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-12">
            {search ? "No matching conversations" : "No conversations yet"}
          </p>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((conv) => (
              <div key={conv.id} className="group relative">
                <button
                  onClick={() => handleSelect(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors duration-150",
                    conv.id === currentConversationId
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <MessageSquare size={13} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13px] font-medium leading-snug text-foreground">
                      {conv.title || "New conversation"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {conv.model && (
                        <span className="text-[10px] font-mono truncate text-muted-foreground/70 max-w-[110px]">
                          {conv.model.split("/").pop()}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50">·</span>
                      <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100",
                    "w-6 h-6 rounded-md flex items-center justify-center",
                    "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                    "transition-all duration-150"
                  )}
                  title="Delete"
                >
                  <Trash2 size={12} />
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
          className="w-full justify-start gap-2.5"
        >
          <Settings size={14} />
          <span>Settings</span>
        </Button>
      </footer>
    </aside>
  );
}

export default Sidebar;