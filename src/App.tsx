import { useEffect } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatView from "./components/Chat/ChatView";
import SettingsModal from "./components/Settings/SettingsModal";
import ErrorBoundary from "./components/ErrorBoundary";
import { useSettingsStore } from "./stores/settingsStore";
import { useUIStore } from "./stores/uiStore";

function App() {
  const load = useSettingsStore((s) => s.load);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ErrorBoundary>
    <div className="flex h-full w-full bg-background">
      <div
        className={`h-full flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-[260px] opacity-100" : "w-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="w-[260px] h-full">
          <Sidebar />
        </div>
      </div>
      <main className="flex-1 flex flex-col min-w-0 relative">
        {!sidebarOpen && (
          <div className="absolute top-3 left-3 z-10">
            <Button variant="ghost" size="icon-sm" onClick={toggleSidebar}>
              <PanelLeft size={16} />
            </Button>
          </div>
        )}
        <ChatView />
      </main>
      <SettingsModal />
    </div>
    </ErrorBoundary>
  );
}

export default App;