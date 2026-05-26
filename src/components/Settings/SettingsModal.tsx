import { useUIStore } from "../../stores/uiStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ApiKeySection from "./ApiKeySection";
import ModelDefaults from "./ModelDefaults";
import { Moon, Monitor } from "lucide-react";

const tabs = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "models", label: "Models" },
] as const;

function AppearanceSection() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Theme</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-primary/30 bg-accent cursor-default">
          <Moon size={22} className="text-primary" />
          <div className="text-center">
            <p className="text-[14px] font-medium text-foreground">Dark</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Currently active</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card cursor-not-allowed opacity-40">
          <Monitor size={22} className="text-muted-foreground" />
          <div className="text-center">
            <p className="text-[14px] font-medium text-muted-foreground">Light</p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsModal() {
  const { settingsOpen, settingsTab, closeSettings, openSettings } = useUIStore();

  return (
    <Dialog open={settingsOpen} onOpenChange={(open) => { if (!open) closeSettings(); }}>
      <DialogContent className="sm:max-w-lg gap-0 p-0" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="font-heading text-xl">Settings</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Configure your API key and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2">
          <div className="flex gap-1 p-1 bg-muted/60 rounded-xl border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => openSettings(tab.id)}
                className={`flex-1 px-3 py-1.5 text-[13px] rounded-lg transition-all duration-200 font-medium ${
                  settingsTab === tab.id
                    ? "bg-card text-foreground shadow-sm shadow-black/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">
          {settingsTab === "general" && <ApiKeySection />}
          {settingsTab === "appearance" && <AppearanceSection />}
          {settingsTab === "models" && <ModelDefaults />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsModal;