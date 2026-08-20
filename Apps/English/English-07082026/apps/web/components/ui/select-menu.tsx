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
			<div
				className={cn("select-menu relative", className)}
				data-dropdown-menu="true"
			>
				<Select.Label className="sr-only">{ariaLabel ?? label}</Select.Label>
				<Select.Trigger
					className="select-menu-trigger group flex min-h-12 w-full items-center gap-3 rounded-xl border border-violet-100 bg-white px-4 py-2.5 text-start outline-none transition-[color,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-violet-200 hover:bg-violet-50/50 focus-visible:border-violet-500 focus-visible:ring-4 focus-visible:ring-violet-600/15 data-[popup-open]:border-violet-200 data-[popup-open]:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
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
					collisionAvoidance={{
						align: "shift",
						fallbackAxisSide: "none",
						side: "shift",
					}}
					side="bottom"
					sideOffset={4}
				>
					<Select.Popup className="select-menu-panel max-h-[min(16rem,var(--available-height))] w-full overflow-y-auto rounded-xl border border-violet-100 bg-white p-0 shadow-[0_14px_34px_rgba(70,50,110,0.12)]">
						<Select.List>
							{options.map((option) => (
								<Select.Item
									className="select-menu-option group flex min-h-11 w-full cursor-default items-center gap-2 border-b border-violet-100 px-4 py-2.5 text-start text-sm text-select-ink-soft outline-none transition-colors last:border-b-0 data-[highlighted]:bg-violet-50 data-[selected]:bg-violet-100 data-[selected]:font-bold data-[selected]:text-violet-950"
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
