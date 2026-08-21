"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "@/lib/utils";

export function Progress({
	className,
	min = 0,
	max = 100,
	value = 0,
	...props
}: ProgressPrimitive.Root.Props) {
	const ratio =
		typeof value === "number" &&
		Number.isFinite(value) &&
		Number.isFinite(min) &&
		Number.isFinite(max) &&
		max > min
			? Math.min(1, Math.max(0, (value - min) / (max - min)))
			: 0;

	return (
		<ProgressPrimitive.Root
			className="w-full"
			data-slot="progress"
			max={max}
			min={min}
			value={value}
			{...props}
		>
			<ProgressPrimitive.Track
				className={cn(
					"relative h-2.5 w-full overflow-hidden rounded-full bg-muted",
					className,
				)}
			>
				<ProgressPrimitive.Indicator
					className="h-full origin-left bg-gradient-to-r from-primary to-emerald-500 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
					style={{ width: "100%", transform: `scaleX(${ratio})` }}
				/>
			</ProgressPrimitive.Track>
		</ProgressPrimitive.Root>
	);
}
