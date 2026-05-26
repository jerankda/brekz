import { Cpu, Thermometer, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../stores/settingsStore";
import { useModelStore } from "../../stores/modelStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModelSelector from "../Chat/ModelSelector";

function ModelDefaults() {
  const {
    defaultModel, defaultTemperature, defaultMaxTokens,
    apiKey, setDefaultModel, setDefaultTemperature, setDefaultMaxTokens,
  } = useSettingsStore();

  const { models, loading, setModels, setLoading } = useModelStore();
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (!apiKey) return;
    setError(null);
    setLoading(true);
    try {
      const data = await invoke<Array<{ id: string; name: string; context_length: number; prompt_pricing: number; completion_pricing: number }>>("fetch_models", { apiKey });
      setModels(data);
      if (!defaultModel && data.length > 0) {
        await setDefaultModel(data[0].id);
      }
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  };

  if (!apiKey) {
    return (
      <div className="space-y-4 animate-fade-up">
        <p className="text-muted-foreground text-sm">
          Save your API key in the General tab first.
        </p>
      </div>
    );
  }

  if (models.length === 0 && !loading) {
    return (
      <div className="space-y-4 animate-fade-up">
        <p className="text-muted-foreground text-sm">
          No models loaded yet.
        </p>
        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            <AlertCircle size={11} />
            {error}
          </div>
        )}
        <Button
          onClick={handleRefresh}
          size="sm"
          className="rounded-lg gap-2"
        >
          <RefreshCw size={13} />
          Load Models
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {models.length} models available
        </p>
        <Button
          variant="link"
          onClick={handleRefresh}
          disabled={loading}
          size="sm"
          className="h-auto p-0 text-xs text-primary hover:text-primary/80"
        >
          <RefreshCw size={11} className={loading ? "animate-spin mr-1" : "mr-1"} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertCircle size={11} />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Cpu size={13} className="text-muted-foreground" />
          Default Model
        </label>
        <ModelSelector value={defaultModel} onChange={setDefaultModel} />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Thermometer size={13} className="text-muted-foreground" />
          Default Temperature
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={defaultTemperature}
            onChange={(e) => setDefaultTemperature(parseFloat(e.target.value))}
            className="flex-1 h-1.5 rounded-full bg-muted appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-primary/20"
          />
          <span className="text-muted-foreground text-xs font-mono w-8 text-right tabular-nums">
            {defaultTemperature.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Zap size={13} className="text-muted-foreground" />
          Max Output Tokens
        </label>
        <Input
          type="number"
          min={64}
          max={131072}
          step={64}
          value={defaultMaxTokens}
          onChange={(e) => setDefaultMaxTokens(parseInt(e.target.value) || 4096)}
        />
      </div>
    </div>
  );
}

export default ModelDefaults;