"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectMenuOption = {
  value: string;
  label: string;
};

// Module-level registry instead of a React context provider: "only one menu
// open at a time" has to hold across unrelated screens and sibling trees, and
// requiring every caller to remember a wrapper component is exactly how that
// rule silently stops being true.
const openMenuClosers = new Set<() => void>();

function closeOtherMenus(keep: () => void) {
  for (const close of openMenuClosers) {
    if (close !== keep) close();
  }
}

export function SelectMenu({
  label,
  value,
  options,
  onChange,
  id,
  className,
  disabled,
  placeholder = "Auswählen…",
  ariaLabel,
}: {
  // ReactNode rather than string so a caller can put an icon beside the
  // label text (the language switcher does). When a node is passed, give
  // `ariaLabel` too so the control still has a plain-text accessible name.
  label: React.ReactNode;
  value: string;
  options: readonly SelectMenuOption[];
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const triggerId = `${fieldId}-trigger`;
  const panelId = `${fieldId}-panel`;

  const [open, setOpen] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const optionRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const openRef = React.useRef(false);
  const closeTimerRef = React.useRef<number | null>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex]?.label : "";

  // Which row the keyboard is on. Kept separate from `value` so arrowing
  // through a long list does not fire onChange for every row passed over --
  // selection only commits on Enter or click.
  const [activeIndex, setActiveIndex] = React.useState(0);

  const close = React.useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    setClosing(true);
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    closeTimerRef.current = window.setTimeout(
      () => {
        setClosing(false);
        closeTimerRef.current = null;
      },
      reducedMotion ? 100 : 160,
    );
  }, []);

  React.useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  // Register/unregister this menu's closer so a newly opened menu can close it.
  React.useEffect(() => {
    if (!open) return;
    openMenuClosers.add(close);
    closeOtherMenus(close);
    return () => {
      openMenuClosers.delete(close);
    };
  }, [close, open]);

  // Outside click. pointerdown rather than click so the menu closes before a
  // click lands on whatever is underneath it.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [close, open]);

  // Move focus onto the active row when the menu opens, so arrow keys work
  // immediately and screen readers announce the current option.
  React.useEffect(() => {
    if (!open) return;
    const start = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(start);
    const frame = requestAnimationFrame(() =>
      optionRefs.current[start]?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [open, selectedIndex]);

  function openMenu() {
    if (disabled) return;
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setClosing(false);
    openRef.current = true;
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    close();
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowDown"
    ) {
      event.preventDefault();
      openMenu();
    }
  }

  function onOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = options.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = index === last ? 0 : index + 1;
        break;
      case "ArrowUp":
        next = index === 0 ? last : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(index);
        return;
      case "Escape":
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        return;
      case "Tab":
        // Let focus leave naturally, but do not leave an orphaned open menu.
        close();
        return;
      default:
        return;
    }
    event.preventDefault();
    setActiveIndex(next);
    optionRefs.current[next]?.focus();
  }

  return (
    <div
      className={cn("select-menu relative", className)}
      // Closing on focus leaving the whole control covers tabbing away and
      // programmatic focus moves, which a blur handler on the trigger alone
      // would miss.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) close();
      }}
      ref={wrapperRef}
    >
      <button
        aria-controls={open ? panelId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="select-menu-trigger flex w-full items-center gap-3 rounded-[14px] border border-select-line bg-select-surface px-3.5 py-2 text-start outline-none transition-[color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-select-accent/40 focus-visible:border-select-accent focus-visible:ring-4 focus-visible:ring-select-accent/15 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        id={triggerId}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className="min-w-0 flex-1">
          <span className="select-menu-label block text-[11px] leading-4 text-select-muted">
            {label}
          </span>
          <span
            className={cn(
              "select-menu-value block truncate text-sm font-bold leading-5",
              selectedLabel ? "text-select-ink" : "text-select-muted",
            )}
          >
            {selectedLabel || placeholder}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-select-muted transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            open && "rotate-180",
          )}
        />
      </button>

      {open || closing ? (
        // left-0/right-0 pins the panel to the trigger's own box, so it
        // always matches the trigger width without measuring it in JS.
        <div
          aria-hidden={closing || undefined}
          aria-labelledby={triggerId}
          className="select-menu-panel absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-[14px] border border-select-line bg-select-surface p-1.5 shadow-[0_4px_14px_rgba(70,50,110,0.07)]"
          data-state={closing ? "closing" : "open"}
          id={panelId}
          role="listbox"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  "select-menu-option flex w-full items-center gap-2 rounded-[9px] px-2.5 py-2 text-start text-sm outline-none transition-colors",
                  isSelected
                    ? "bg-select-selected font-bold text-select-accent-ink"
                    : "text-select-ink-soft hover:bg-select-hover",
                  "focus-visible:bg-select-hover focus-visible:ring-2 focus-visible:ring-select-accent/40",
                )}
                key={option.value}
                onClick={() => commit(index)}
                onKeyDown={(event) => onOptionKeyDown(event, index)}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                tabIndex={!closing && index === activeIndex ? 0 : -1}
                type="button"
              >
                <Check
                  aria-hidden
                  className={cn(
                    "size-3.5 shrink-0 text-select-accent",
                    isSelected ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
