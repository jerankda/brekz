import Select from "../UI/Select";
import { useModelStore } from "../../stores/modelStore";

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
  disabled?: boolean
}

function ModelSelector({ value, onChange, disabled = false }: ModelSelectorProps) {
  const { models, loading } = useModelStore();

  const grouped = new Map<string, string>();
  models.forEach((m) => {
    const parts = m.id.split("/");
    const provider = parts.length > 1 ? parts[0] : "Other";
    grouped.set(m.id, provider);
  });

  const options = models.map((m) => {
    const parts = m.id.split("/");
    const provider = parts.length > 1 ? parts[0] : "Other";
    const free = m.prompt_pricing === 0 && m.completion_pricing === 0 ? " · Free" : "";
    const cost = m.prompt_pricing > 0 || m.completion_pricing > 0
      ? `$${m.prompt_pricing.toFixed(2)}/$ ${m.completion_pricing.toFixed(2)} per 1M`
      : "";

    return {
      value: m.id,
      label: m.name,
      group: provider.charAt(0).toUpperCase() + provider.slice(1),
      description: free || cost || undefined,
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