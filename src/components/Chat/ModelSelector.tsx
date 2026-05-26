import { useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useModelStore } from "../../stores/modelStore";
import { cn } from "@/lib/utils";

const CURATED_PROVIDERS = new Set([
  "anthropic",
  "openai",
  "deepseek",
  "meta-llama",
  "google",
]);

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  deepseek: "DeepSeek",
  "meta-llama": "Meta",
  google: "Google",
};

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
  disabled?: boolean
}

function ModelSelector({ value, onChange, disabled = false }: ModelSelectorProps) {
  const { models, loading } = useModelStore();
  const [open, setOpen] = useState(false);

  const selectedModel = models.find((m) => m.id === value);
  const selectLabel = selectedModel ? selectedModel.name : (loading ? "Loading models..." : "Select a model");

  const curatedModels = models
    .filter((m) => {
      const provider = m.id.split("/")[0];
      return CURATED_PROVIDERS.has(provider);
    })
    .sort((a, b) => {
      const pa = a.id.split("/")[0];
      const pb = b.id.split("/")[0];
      if (pa !== pb) return Array.from(CURATED_PROVIDERS).indexOf(pa) - Array.from(CURATED_PROVIDERS).indexOf(pb);
      return 0;
    });

  const allModels = models;

  if (models.length === 0 && !loading) {
    return (
      <p className="text-muted-foreground text-xs px-1">
        No models loaded. Validate your API key first.
      </p>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled || loading}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-[13px] font-normal"
        >
          <span className="truncate">{selectLabel}</span>
          <ChevronDown size={13} className="text-muted-foreground flex-shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Search any model..." />
          <CommandList>
            <CommandEmpty>No models found</CommandEmpty>

            {curatedModels.length > 0 && (
              <CommandGroup heading="Featured">
                {curatedModels.map((m) => {
                  const provider = m.id.split("/")[0];
                  const isFree = m.prompt_pricing === 0 && m.completion_pricing === 0;
                  return (
                    <CommandItem
                      key={m.id}
                      value={m.id}
                      onSelect={(currentValue) => {
                        onChange(currentValue);
                        setOpen(false);
                      }}
                    >
                      <Sparkles size={13} className="text-primary/60" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate text-[13px]">{m.name}</span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {PROVIDER_LABELS[provider] || provider}
                          {isFree ? " · Free" : ""}
                        </span>
                      </div>
                      <Check
                        size={14}
                        className={cn(
                          "flex-shrink-0 ml-2",
                          value === m.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            <CommandGroup heading="All models">
              {allModels.map((m) => {
                const isFree = m.prompt_pricing === 0 && m.completion_pricing === 0;
                return (
                  <CommandItem
                    key={m.id}
                    value={m.id}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-[13px]">{m.name}</span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {m.id}
                        {isFree ? " · Free" : ""}
                      </span>
                    </div>
                    <Check
                      size={14}
                      className={cn(
                        "flex-shrink-0 ml-2",
                        value === m.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ModelSelector;