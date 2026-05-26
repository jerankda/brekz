import { useUIStore } from "../../stores/uiStore";
import Dialog from "../UI/Dialog";
import ApiKeySection from "./ApiKeySection";
import ModelDefaults from "./ModelDefaults";

const tabs = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "models", label: "Models" },
] as const;

function SettingsModal() {
  const { settingsOpen, settingsTab, closeSettings, openSettings } = useUIStore();

  return (
    <Dialog open={settingsOpen} onClose={closeSettings} title="Settings">
      <div className="flex gap-1 mb-6 border-b border-border pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => openSettings(tab.id)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
              settingsTab === tab.id
                ? "bg-primary-light text-primary font-medium"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {settingsTab === "general" && <ApiKeySection />}
      {settingsTab === "appearance" && (
        <p className="text-text-secondary text-sm">Appearance settings coming soon.</p>
      )}
      {settingsTab === "models" && <ModelDefaults />}
    </Dialog>
  );
}

export default SettingsModal;