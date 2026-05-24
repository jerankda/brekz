import { Plus, Search } from "lucide-react";

function Sidebar() {
  return (
    <aside className="w-[280px] h-full flex flex-col bg-surface border-r border-border flex-shrink-0">
      <div className="p-4 border-b border-border">
        <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors cursor-pointer">
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg text-text-secondary text-sm">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search conversations..."
            className="bg-transparent border-none outline-none text-text-primary text-sm w-full"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <p className="text-text-secondary text-xs px-3 py-2 font-medium">
          No conversations yet
        </p>
      </nav>
    </aside>
  );
}

export default Sidebar;