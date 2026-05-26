import { Cpu, Thermometer, Zap } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { useModels } from "../../hooks/useModels";
import ModelSelector from "../Chat/ModelSelector";

function ModelDefaults() {
  const {
    defaultModel, defaultTemperature, defaultMaxTokens,
    setDefaultModel, setDefaultTemperature, setDefaultMaxTokens,
  } = useSettingsStore();

  const { models, loading } = useModels();

  if (!models.length && !loading) {
    return (
      <div className="space-y-4">
        <p className="text-text-secondary text-sm">
          Save and validate your API key in the General tab to load available models.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Cpu size={14} className="text-text-secondary" />
          Default Model
        </label>
        <ModelSelector value={defaultModel} onChange={setDefaultModel} />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Thermometer size={14} className="text-text-secondary" />
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
            className="flex-1 h-2 rounded-full bg-bg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <span className="text-text-secondary text-xs font-mono w-8 text-right">
            {defaultTemperature.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Zap size={14} className="text-text-secondary" />
          Max Output Tokens
        </label>
        <input
          type="number"
          min="64"
          max="131072"
          step="64"
          value={defaultMaxTokens}
          onChange={(e) => setDefaultMaxTokens(parseInt(e.target.value) || 4096)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm outline-none focus:border-primary transition-colors"
        />
      </div>
    </div>
  );
}

export default ModelDefaults;