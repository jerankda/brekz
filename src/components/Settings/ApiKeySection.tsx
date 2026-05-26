import { useState } from "react";
import { Eye, EyeOff, CheckCircle, XCircle, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../stores/settingsStore";
import { useModelStore } from "../../stores/modelStore";
import type { ModelEntry } from "../../types/chat";

function ApiKeySection() {
  const { apiKey, apiKeyValid, setApiKey, setApiKeyValid } = useSettingsStore();
  const fetchAndSetModels = useModelStore((s) => s.setModels);
  const [showKey, setShowKey] = useState(false);
  const [inputValue, setInputValue] = useState(apiKey ?? "");
  const [validating, setValidating] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const getBorderClass = () => {
    if (!apiKey) return "border-border";
    if (apiKeyValid) return "border-success";
    return "border-error";
  };

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
          setModelError(`Models loaded: ${String(e)}`);
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
        <KeyRound size={16} className="text-text-secondary" />
        <label className="text-sm font-medium text-text-primary">API Key</label>
        {apiKey && (
          apiKeyValid ? (
            <span className="flex items-center gap-1 text-xs text-success"><CheckCircle size={12} /> Valid</span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-error"><XCircle size={12} /> Not validated</span>
          )
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? "text" : "password"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="sk-or-v1-..."
            className={`w-full px-3 py-2 pr-10 rounded-lg border bg-bg text-text-primary text-sm outline-none transition-colors focus:border-primary ${getBorderClass()}`}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {modelError && (
        <div className="flex items-center gap-2 text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
          <AlertCircle size={12} />
          {modelError}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!inputValue.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Save Key
        </button>
        <button
          onClick={handleValidate}
          disabled={(!inputValue.trim() && !apiKey) || validating}
          className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
        >
          {validating ? <Loader2 size={14} className="animate-spin" /> : null}
          {validating ? "Validating..." : "Validate"}
        </button>
        {apiKey && (
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:text-text-primary transition-colors cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>

      <p className="text-xs text-text-secondary leading-relaxed">
        Your API key is stored locally on your device. It is only sent to OpenRouter to make API requests.
        Get your key from{" "}
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary-hover underline"
        >
          openrouter.ai/keys
        </a>
      </p>
    </div>
  );
}

export default ApiKeySection;