import { useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatView from "./components/Chat/ChatView";
import SettingsModal from "./components/Settings/SettingsModal";
import { useSettingsStore } from "./stores/settingsStore";
import { useModelStore } from "./stores/modelStore";

function App() {
  const { load, apiKey } = useSettingsStore((s) => ({ load: s.load, apiKey: s.apiKey }));
  const fetchAndSetModels = useModelStore((s) => s.setModels);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!apiKey) return;

    import("@tauri-apps/api/core").then(({ invoke }) => {
      invoke("fetch_models", { apiKey })
        .then((models) => fetchAndSetModels(models as Array<{ id: string; name: string; context_length: number; prompt_pricing: number; completion_pricing: number }>))
        .catch(() => {});
    });
  }, [apiKey, fetchAndSetModels]);

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