"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
	return (
		<AccordionPrimitive.Root
			className={cn("flex w-full flex-col", className)}
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
			className={cn("border-b", className)}
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
					"group/accordion-trigger flex flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-[color,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] outline-none hover:underline focus-visible:ring-4 focus-visible:ring-primary/20",
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
			data-slot="accordion-content"
			{...props}
		>
			<div className={cn("pb-4 pt-0", className)}>{children}</div>
		</AccordionPrimitive.Panel>
	);
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
