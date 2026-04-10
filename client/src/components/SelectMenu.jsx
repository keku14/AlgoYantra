import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SelectMenu({
  value,
  onChange,
  options = [],
  className = "",
  buttonClassName = "",
  menuClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value) || options[0] || null;

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-white outline-none transition hover:bg-white/12 focus:border-cyan-300/50 light:border-slate-200 light:bg-white light:text-slate-900 ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption?.label || ""}</span>
        <ChevronDown size={18} className={`shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className={`absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950/98 shadow-2xl backdrop-blur light:border-slate-200 light:bg-white ${menuClassName}`}>
          <div className="max-h-64 overflow-y-auto p-2">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    isSelected
                      ? "bg-cyan-400/15 text-cyan-100 light:bg-cyan-50 light:text-cyan-700"
                      : "text-slate-200 hover:bg-white/8 light:text-slate-700 light:hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
