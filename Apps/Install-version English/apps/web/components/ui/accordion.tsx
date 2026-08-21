"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
	return (
		<AccordionPrimitive.Root
			className={cn("flex w-full flex-col", className)}
			data-dropdown-menu="true"
			data-slot="accordion"
			{...props}
		/>
	);
}

function AccordionItem({
	className,
	...props
}: AccordionPrimitive.Item.Props) {
	return (
		<AccordionPrimitive.Item
			className={cn(
				"border-b border-violet-100 last:border-b-0 data-[open]:bg-violet-50/35",
				className,
			)}
			data-slot="accordion-item"
			{...props}
		/>
	);
}

function AccordionTrigger({
	className,
	children,
	...props
}: AccordionPrimitive.Trigger.Props) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				className={cn(
					"group/accordion-trigger flex min-h-12 flex-1 items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 outline-none transition-[color,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-violet-50 hover:text-violet-950 hover:no-underline focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-violet-600/20 aria-expanded:bg-violet-50 aria-expanded:text-violet-950",
					className,
				)}
				data-slot="accordion-trigger"
				{...props}
			>
				{children}
				<ChevronDown
					aria-hidden
					className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-aria-expanded/accordion-trigger:rotate-180 motion-reduce:duration-[0.01ms]"
				/>
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

function AccordionContent({
	className,
	children,
	...props
}: AccordionPrimitive.Panel.Props) {
	return (
		<AccordionPrimitive.Panel
			className="h-(--accordion-panel-height) overflow-hidden text-sm"
			data-dropdown-panel="true"
			data-slot="accordion-content"
			{...props}
		>
			<div className={cn("pb-4 pt-0", className)}>{children}</div>
		</AccordionPrimitive.Panel>
	);
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
