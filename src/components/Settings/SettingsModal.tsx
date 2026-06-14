import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useUIStore } from "../../stores/uiStore";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ApiKeySection from "./ApiKeySection";
import ModelDefaults from "./ModelDefaults";
import { Moon, Monitor, Trash2, AlertTriangle } from "lucide-react";

const tabs = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "models", label: "Models" },
  { id: "data", label: "Data" },
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

function DataSection() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const setCurrentConversation = useChatStore((s) => s.setCurrentConversation);
  const setMessages = useChatStore((s) => s.setMessages);
  const bumpTitleRefresh = useChatStore((s) => s.bumpTitleRefresh);
  const setDefaultModel = useSettingsStore((s) => s.setDefaultModel);
  const setDefaultTemperature = useSettingsStore((s) => s.setDefaultTemperature);
  const setDefaultMaxTokens = useSettingsStore((s) => s.setDefaultMaxTokens);
  const setDefaultSystemPrompt = useSettingsStore((s) => s.setDefaultSystemPrompt);

  const handleDeleteAll = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      await invoke("delete_all_conversations");
      // Reset settings except API key
      await setDefaultModel("");
      await setDefaultTemperature(0.7);
      await setDefaultMaxTokens(4096);
      await setDefaultSystemPrompt("");
      // Clear current chat state
      setCurrentConversation(null);
      setMessages([]);
      bumpTitleRefresh();
      setDeleted(true);
      setConfirming(false);
    } catch (e) {
      console.error("Failed to delete data:", e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Delete all data</p>
        <p className="text-[13px] text-muted-foreground mb-4">
          Permanently delete all conversations, messages, and reset settings. Your API key will be kept.
        </p>

        {deleted ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-[13px] text-green-400">All data has been deleted successfully.</p>
          </div>
        ) : confirming ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-destructive">
                This will permanently delete all your conversations and messages. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAll}
                disabled={deleting}
                className="gap-2"
              >
                <Trash2 size={14} />
                {deleting ? "Deleting..." : "Yes, delete everything"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAll}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
          >
            <Trash2 size={14} />
            Delete all data
          </Button>
        )}
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
          {settingsTab === "data" && <DataSection />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsModal;
