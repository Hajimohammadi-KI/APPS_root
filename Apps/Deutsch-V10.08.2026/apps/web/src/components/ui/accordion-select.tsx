"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccordionSelectOption = {
	value: string;
	label: string;
};

// Coordinates "only one section open at a time on small screens" across a set
// of AccordionSelect fields. On desktop each field keeps its own open state so
// several can stay open at once, which is faster when comparing filters.
type GroupContextValue = {
	openId: string | null;
	setOpenId: (id: string | null) => void;
	singleOpen: boolean;
};

const GroupContext = React.createContext<GroupContextValue | null>(null);

const SMALL_SCREEN_QUERY = "(max-width: 640px)";

export function AccordionSelectGroup({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const [openId, setOpenId] = React.useState<string | null>(null);
	const [singleOpen, setSingleOpen] = React.useState(false);

	React.useEffect(() => {
		const query = window.matchMedia(SMALL_SCREEN_QUERY);
		const update = () => setSingleOpen(query.matches);
		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);

	const value = React.useMemo(
		() => ({ openId, setOpenId, singleOpen }),
		[openId, singleOpen],
	);

	return (
		<GroupContext.Provider value={value}>
			<div className={className}>{children}</div>
		</GroupContext.Provider>
	);
}

export function AccordionSelect({
	label,
	value,
	options,
	onChange,
	id,
	className,
	disabled,
}: {
	label: string;
	value: string;
	options: readonly AccordionSelectOption[];
	onChange: (value: string) => void;
	id?: string;
	className?: string;
	disabled?: boolean;
}) {
	const group = React.useContext(GroupContext);
	const generatedId = React.useId();
	const fieldId = id ?? generatedId;
	const triggerId = `${fieldId}-trigger`;
	const panelId = `${fieldId}-panel`;

	const [localOpen, setLocalOpen] = React.useState(false);
	const triggerRef = React.useRef<HTMLButtonElement | null>(null);
	const optionRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

	// On small screens the parent group owns the open state so opening one
	// field closes the others; on desktop each field tracks its own.
	const open = group?.singleOpen ? group.openId === fieldId : localOpen;

	const setOpen = React.useCallback(
		(next: boolean) => {
			if (group?.singleOpen) group.setOpenId(next ? fieldId : null);
			else setLocalOpen(next);
		},
		[fieldId, group],
	);

	const selectedIndex = options.findIndex((option) => option.value === value);
	const selectedLabel = options[selectedIndex]?.label ?? value;

	// Single-select listbox keys: arrows move focus and selection follows it,
	// Home/End jump to the ends, Escape closes and returns focus to the trigger.
	const handleOptionKeyDown = (
		event: React.KeyboardEvent<HTMLButtonElement>,
		index: number,
	) => {
		const last = options.length - 1;
		let nextIndex: number;
		switch (event.key) {
			case "ArrowDown":
			case "ArrowRight":
				nextIndex = index === last ? 0 : index + 1;
				break;
			case "ArrowUp":
			case "ArrowLeft":
				nextIndex = index === 0 ? last : index - 1;
				break;
			case "Home":
				nextIndex = 0;
				break;
			case "End":
				nextIndex = last;
				break;
			case "Escape":
				event.preventDefault();
				setOpen(false);
				triggerRef.current?.focus();
				return;
			default:
				return;
		}
		event.preventDefault();
		const nextOption = options[nextIndex];
		if (!nextOption) return;
		onChange(nextOption.value);
		optionRefs.current[nextIndex]?.focus();
	};

	return (
		<div
			className={cn(
				"accordion-select overflow-hidden rounded-xl border border-input bg-background",
				className,
			)}
		>
			<button
				aria-controls={panelId}
				aria-expanded={open}
				className="accordion-select-trigger flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-60"
				disabled={disabled}
				id={triggerId}
				onClick={() => setOpen(!open)}
				ref={triggerRef}
				type="button"
			>
				<span className="min-w-0 flex-1">
					<span className="accordion-select-label block text-xs font-semibold text-muted-foreground">
						{label}
					</span>
					<span className="accordion-select-value block truncate text-sm font-bold">
						{selectedLabel}
					</span>
				</span>
				<ChevronDown
					aria-hidden
					className={cn(
						"size-4 shrink-0 text-muted-foreground transition-transform duration-200",
						open && "rotate-180",
					)}
				/>
			</button>
			{open ? (
				<div
					aria-labelledby={triggerId}
					className="accordion-select-panel grid gap-1 border-t border-input p-2"
					id={panelId}
					role="listbox"
				>
					{options.map((option, index) => {
						const selected = option.value === value;
						// Roving tabindex: one stop for the whole group.
						const tabbable = selected || (selectedIndex === -1 && index === 0);
						return (
							<button
								aria-selected={selected}
								className={cn(
									"accordion-select-option flex min-h-10 items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm outline-none transition-colors",
									"focus-visible:ring-4 focus-visible:ring-primary/10",
									selected
										? "bg-primary/10 font-bold text-primary"
										: "hover:bg-muted",
								)}
								key={option.value}
								onClick={() => onChange(option.value)}
								onKeyDown={(event) => handleOptionKeyDown(event, index)}
								ref={(node) => {
									optionRefs.current[index] = node;
								}}
								role="option"
								tabIndex={tabbable ? 0 : -1}
								type="button"
							>
								<Check
									aria-hidden
									className={cn(
										"size-4 shrink-0",
										selected ? "opacity-100" : "opacity-0",
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
