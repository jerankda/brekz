import { useState } from "react";
import { Eye, EyeOff, CheckCircle, XCircle, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../stores/settingsStore";
import { useModelStore } from "../../stores/modelStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ModelEntry } from "../../types/chat";
import { cn } from "@/lib/utils";

function ApiKeySection() {
  const { apiKey, apiKeyValid, setApiKey, setApiKeyValid } = useSettingsStore();
  const fetchAndSetModels = useModelStore((s) => s.setModels);
  const [showKey, setShowKey] = useState(false);
  const [inputValue, setInputValue] = useState(apiKey ?? "");
  const [validating, setValidating] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const borderClass = !apiKey
    ? "border-border"
    : apiKeyValid
      ? "border-emerald-500/50"
      : "border-destructive/50";

  const handleSave = async () => {
    await setApiKey(inputValue.trim() || null);
  };

  const handleValidate = async () => {
    const key = inputValue.trim() || apiKey;
    if (!key) return;

    if (inputValue.trim() && inputValue.trim() !== apiKey) {
      await setApiKey(inputValue.trim());
    }

    setModelError(null);
    setValidating(true);
    try {
      const valid = await invoke<boolean>("validate_api_key", { apiKey: key });
      setApiKeyValid(valid);
      if (valid) {
        try {
          const models = await invoke<ModelEntry[]>("fetch_models", { apiKey: key });
          fetchAndSetModels(models);
          const settingsStore = useSettingsStore.getState();
          if (!settingsStore.defaultModel && models.length > 0) {
            await settingsStore.setDefaultModel(models[0].id);
          }
        } catch (e) {
          setModelError(`Failed to load models: ${String(e)}`);
        }
      }
    } catch {
      setApiKeyValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleClear = async () => {
    setInputValue("");
    await setApiKey(null);
    setApiKeyValid(false);
    setModelError(null);
    useModelStore.getState().setModels([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound size={15} className="text-muted-foreground" />
        <label className="text-sm font-medium text-foreground">API Key</label>
        {apiKey && (
          apiKeyValid ? (
            <span className="flex items-center gap-1 text-xs text-emerald-500"><CheckCircle size={11} /> Valid</span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-destructive"><XCircle size={11} /> Not validated</span>
          )
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? "text" : "password"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="sk-or-v1-..."
            className={cn("pr-10", borderClass)}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {modelError && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 animate-fade-up">
          <AlertCircle size={11} />
          {modelError}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!inputValue.trim()}
          size="sm"
          className="rounded-lg"
        >
          Save Key
        </Button>
        <Button
          variant="outline"
          onClick={handleValidate}
          disabled={(!inputValue.trim() && !apiKey) || validating}
          size="sm"
          className="rounded-lg"
        >
          {validating && <Loader2 size={13} className="animate-spin mr-1" />}
          {validating ? "Validating..." : "Validate"}
        </Button>
        {apiKey && (
          <Button
            variant="outline"
            onClick={handleClear}
            size="sm"
            className="rounded-lg"
          >
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Your API key is stored locally on your device. It is only sent to OpenRouter to make API requests.
        Get your key from{" "}
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
        >
          openrouter.ai/keys
        </a>
      </p>
    </div>
  );
}

export default ApiKeySection;