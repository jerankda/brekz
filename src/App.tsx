import { useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatView from "./components/Chat/ChatView";
import SettingsModal from "./components/Settings/SettingsModal";
import { useSettingsStore } from "./stores/settingsStore";

function App() {
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="flex h-full w-full bg-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatView />
      </main>
      <SettingsModal />
    </div>
  );
}

export default App;