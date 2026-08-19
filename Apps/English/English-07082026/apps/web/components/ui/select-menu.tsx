"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectMenuOption = {
	value: string;
	label: string;
};

export function SelectMenu({
	label,
	value,
	options,
	onChange,
	id,
	className,
	disabled,
	placeholder = "Select…",
	ariaLabel,
}: {
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
	const selectedValue = options.some((option) => option.value === value)
		? value
		: null;

	return (
		<Select.Root
			disabled={disabled}
			id={fieldId}
			items={options}
			modal={false}
			onValueChange={(nextValue) => {
				if (typeof nextValue === "string") onChange(nextValue);
			}}
			value={selectedValue}
		>
			<div className={cn("select-menu relative", className)}>
				<Select.Label className="sr-only">{ariaLabel ?? label}</Select.Label>
				<Select.Trigger
					className="select-menu-trigger group flex w-full items-center gap-3 rounded-[14px] border border-select-line bg-select-surface px-3.5 py-2 text-start outline-none transition-[color,border-color,transform] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-select-accent/40 focus-visible:border-select-accent focus-visible:ring-4 focus-visible:ring-select-accent/15 active:scale-[.97] active:duration-150 disabled:cursor-not-allowed disabled:opacity-60"
					id={`${fieldId}-trigger`}
				>
					<span className="min-w-0 flex-1">
						<span className="select-menu-label block text-[11px] leading-4 text-select-muted">
							{label}
						</span>
						<Select.Value
							className="select-menu-value block truncate text-sm font-bold leading-5 text-select-ink data-[placeholder]:text-select-muted"
							placeholder={placeholder}
						/>
					</span>
					<Select.Icon className="select-menu-icon flex shrink-0 text-select-muted">
						<ChevronDown aria-hidden className="size-4" />
					</Select.Icon>
				</Select.Trigger>

				<Select.Positioner
					align="start"
					alignItemWithTrigger={false}
					className="select-menu-positioner z-50 w-[var(--anchor-width)]"
					side="bottom"
					sideOffset={4}
				>
					<Select.Popup className="select-menu-panel max-h-[min(16rem,var(--available-height))] w-full overflow-y-auto rounded-[14px] border border-select-line bg-select-surface p-1.5 shadow-[0_4px_14px_rgba(70,50,110,0.07)]">
						<Select.List>
							{options.map((option) => (
								<Select.Item
									className="select-menu-option group flex w-full cursor-default items-center gap-2 rounded-[9px] px-2.5 py-2 text-start text-sm text-select-ink-soft outline-none transition-colors data-[highlighted]:bg-select-hover data-[selected]:bg-select-selected data-[selected]:font-bold data-[selected]:text-select-accent-ink"
									key={option.value}
									label={option.label}
									value={option.value}
								>
									<span aria-hidden className="flex size-3.5 shrink-0 items-center justify-center">
										<Select.ItemIndicator>
											<Check className="size-3.5 text-select-accent" />
										</Select.ItemIndicator>
									</span>
									<Select.ItemText className="min-w-0 flex-1 truncate">
										{option.label}
									</Select.ItemText>
								</Select.Item>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</div>
		</Select.Root>
	);
}
