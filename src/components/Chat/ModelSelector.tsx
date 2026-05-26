import Select from "../UI/Select";
import { useModelStore } from "../../stores/modelStore";

const CURATED_PROVIDERS = new Set([
  "anthropic",
  "openai",
  "deepseek",
  "meta-llama",
  "google",
]);

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
  disabled?: boolean
}

function ModelSelector({ value, onChange, disabled = false }: ModelSelectorProps) {
  const { models, loading } = useModelStore();

  const options = models.map((m) => {
    const parts = m.id.split("/");
    const provider = parts.length > 1 ? parts[0] : "Other";
    const free = m.prompt_pricing === 0 && m.completion_pricing === 0 ? " · Free" : "";
    const cost = m.prompt_pricing > 0 || m.completion_pricing > 0
      ? `$${m.prompt_pricing.toFixed(2)}/$ ${m.completion_pricing.toFixed(2)} per 1M`
      : "";
    const isCurated = CURATED_PROVIDERS.has(provider);

    return {
      value: m.id,
      label: m.name,
      group: isCurated ? (provider.charAt(0).toUpperCase() + provider.slice(1)) : undefined,
      description: free || cost || undefined,
      featured: isCurated,
    };
  });

  if (models.length === 0 && !loading) {
    return (
      <div className="text-text-secondary text-xs px-3 py-2">
        No models loaded. Validate your API key first.
      </div>
    );
  }

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={loading ? "Loading models..." : "Select a model"}
      disabled={disabled || loading}
      emptyMessage="No models found"
    />
  );
}

export default ModelSelector;