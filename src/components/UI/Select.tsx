import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string
  label: string
  group?: string
  description?: string
  featured?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  emptyMessage?: string
}

function Select({ options, value, onChange, placeholder = "Select...", disabled = false, emptyMessage = "No options" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()) || o.value.toLowerCase().includes(search.toLowerCase()))
    : options.filter((o) => o.featured !== false);

  const grouped = new Map<string, SelectOption[]>();
  filtered.forEach((o) => {
    const g = o.group ?? "";
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(o);
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-text-secondary transition-colors cursor-pointer"
      >
        <span className={selected ? "text-text-primary" : "text-text-secondary truncate"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={14} className={`text-text-secondary flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-[280px] flex flex-col">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full px-2 py-1 rounded-md bg-bg text-text-primary text-sm outline-none border border-border focus:border-primary transition-colors"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filtered.length === 0 ? (
              <p className="text-text-secondary text-xs px-3 py-4 text-center">{emptyMessage}</p>
            ) : grouped.size <= 1 && !grouped.has("") ? (
              grouped.entries().next()?.value?.[1]?.map((o) => (
                <OptionItem key={o.value} option={o} selected={o.value === value} onSelect={() => { onChange(o.value); setOpen(false); setSearch(""); }} />
              ))
            ) : (
              <>
                {Array.from(grouped.entries()).map(([group, opts]) => (
                  <div key={group}>
                    {group && <p className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5">{group}</p>}
                    {opts.map((o) => (
                      <OptionItem key={o.value} option={o} selected={o.value === value} onSelect={() => { onChange(o.value); setOpen(false); setSearch(""); }} />
                    ))}
                  </div>
                ))}
                {!search && (
                  <p className="text-text-secondary text-xs px-3 py-3 text-center border-t border-border mt-1">
                    Search above to find any model
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionItem({ option, selected, onSelect }: { option: SelectOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-left transition-colors cursor-pointer ${
        selected ? "bg-primary-light text-primary font-medium" : "text-text-primary hover:bg-bg"
      }`}
    >
      <div className="flex flex-col min-w-0">
        <span className="truncate">{option.label}</span>
        {option.description && (
          <span className="text-text-secondary text-xs truncate">{option.description}</span>
        )}
      </div>
      {selected && <Check size={14} className="flex-shrink-0 ml-2" />}
    </button>
  );
}

export default Select;
