import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-bold leading-tight whitespace-normal transition-[color,background-color,border-color,transform] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[.97] active:duration-150",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
				secondary:
					"border border-border bg-secondary text-secondary-foreground hover:bg-secondary/75",
				outline:
					"border border-border bg-background text-foreground hover:bg-muted",
				ghost: "text-foreground hover:bg-muted",
				destructive:
					"border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
			},
			size: {
				default: "h-10",
				sm: "h-9 rounded-lg px-3 text-xs",
				lg: "h-12 rounded-2xl px-6",
				icon: "size-10 px-0",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export function Button({
	className,
	variant,
	size,
	nativeButton,
	render,
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	const rendersNativeButton =
		!React.isValidElement(render) || render.type === "button";
	return (
		<ButtonPrimitive
			className={cn(buttonVariants({ variant, size }), className)}
			data-slot="button"
			nativeButton={nativeButton ?? rendersNativeButton}
			render={render}
			{...props}
		/>
	);
}

export { buttonVariants };
