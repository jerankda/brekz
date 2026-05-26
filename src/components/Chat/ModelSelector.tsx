import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      id: m.id,
      name: m.name,
      group: isCurated ? (provider.charAt(0).toUpperCase() + provider.slice(1)) : undefined,
      description: free || cost || undefined,
      isCurated,
    };
  });

  const grouped = new Map<string, typeof options>();
  const curated = options.filter((o) => o.isCurated);
  const uncurated = options.filter((o) => !o.isCurated);

  curated.forEach((o) => {
    const g = o.group ?? "Other";
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(o);
  });
  if (uncurated.length > 0) {
    grouped.set("Other", uncurated);
  }

  if (models.length === 0 && !loading) {
    return (
      <p className="text-muted-foreground text-xs px-1">
        No models loaded. Validate your API key first.
      </p>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading models..." : "Select a model"} />
      </SelectTrigger>
      <SelectContent className="max-h-[320px]">
        {Array.from(grouped.entries()).map(([group, opts]) => (
          <SelectGroup key={group}>
            <SelectLabel>{group}</SelectLabel>
            {opts.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{o.name}</span>
                  {o.description && (
                    <span className="text-muted-foreground text-[11px] truncate">{o.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

export default ModelSelector;