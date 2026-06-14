import { useState } from "react";
import { Check, ChevronDown, Sparkles, Star } from "lucide-react";
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
import { useSettingsStore } from "../../stores/settingsStore";
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
  const { favoriteModels, toggleFavoriteModel } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"favorites" | "all">(favoriteModels.length > 0 ? "favorites" : "all");

  const selectedModel = models.find((m) => m.id === value);
  const selectLabel = selectedModel ? selectedModel.name : (loading ? "Loading models..." : "Select a model");

  const favoriteModelsList = models.filter((m) => favoriteModels.includes(m.id));

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

  const handleToggleFavorite = (e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavoriteModel(modelId);
  };

  const renderModelItem = (m: typeof models[0], showProvider?: boolean) => {
    const provider = m.id.split("/")[0];
    const isFree = m.prompt_pricing === 0 && m.completion_pricing === 0;
    const isFav = favoriteModels.includes(m.id);

    return (
      <CommandItem
        key={m.id}
        value={m.id}
        onSelect={(currentValue) => {
          onChange(currentValue);
          setOpen(false);
        }}
      >
        {showProvider && <Sparkles size={13} className="text-primary/60 flex-shrink-0" />}
        <div className={cn("flex flex-col min-w-0 flex-1", showProvider && "ml-2")}>
          <span className="text-[13px] text-foreground">{m.name}</span>
          <span className="text-[11px] text-muted-foreground">
            {showProvider ? (PROVIDER_LABELS[provider] || provider) : m.id}
            {isFree ? " · Free" : ""}
          </span>
        </div>
        <button
          onClick={(e) => handleToggleFavorite(e, m.id)}
          className={cn(
            "flex-shrink-0 ml-1 p-0.5 rounded hover:bg-accent transition-colors",
            isFav ? "text-yellow-500" : "text-muted-foreground/30 hover:text-muted-foreground/60"
          )}
        >
          <Star size={13} fill={isFav ? "currentColor" : "none"} />
        </button>
        <Check
          size={14}
          className={cn(
            "flex-shrink-0 ml-1",
            value === m.id ? "opacity-100" : "opacity-0"
          )}
        />
      </CommandItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled || loading}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-sm font-normal"
        >
          <span className="truncate">{selectLabel}</span>
          <ChevronDown size={13} className="text-muted-foreground flex-shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start" sideOffset={4}>
        <div className="flex gap-1 p-2 pb-0">
          <button
            onClick={() => setTab("favorites")}
            className={cn(
              "flex-1 px-3 py-1.5 text-[12px] rounded-md transition-all duration-200 font-medium",
              tab === "favorites"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Favorites{favoriteModelsList.length > 0 && ` (${favoriteModelsList.length})`}
          </button>
          <button
            onClick={() => setTab("all")}
            className={cn(
              "flex-1 px-3 py-1.5 text-[12px] rounded-md transition-all duration-200 font-medium",
              tab === "all"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All models
          </button>
        </div>
        <Command>
          <CommandInput placeholder="Search any model..." />
          <CommandList>
            <CommandEmpty>No models found</CommandEmpty>

            {tab === "favorites" && (
              <>
                {favoriteModelsList.length === 0 ? (
                  <div className="py-8 text-center">
                    <Star size={20} className="mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-xs">No favorite models yet</p>
                    <p className="text-muted-foreground/60 text-[11px] mt-1">
                      Star models in the All tab to add them here
                    </p>
                  </div>
                ) : (
                  <CommandGroup heading="Favorites">
                    {favoriteModelsList.map((m) => renderModelItem(m, false))}
                  </CommandGroup>
                )}
              </>
            )}

            {tab === "all" && (
              <>
                {curatedModels.length > 0 && (
                  <CommandGroup heading="Featured">
                    {curatedModels.map((m) => renderModelItem(m, true))}
                  </CommandGroup>
                )}

                <CommandGroup heading="All models">
                  {allModels.map((m) => renderModelItem(m, false))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ModelSelector;
