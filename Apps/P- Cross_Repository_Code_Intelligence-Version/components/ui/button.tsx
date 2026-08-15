import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-700/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "border border-violet-800 bg-violet-800 text-white shadow-sm hover:bg-violet-950",
        outline: "border border-slate-300 bg-white text-slate-900 hover:border-violet-700 hover:bg-violet-50",
        ghost: "border border-transparent bg-transparent text-violet-950 hover:bg-violet-50",
        danger: "border border-red-300 bg-red-50 text-red-800 hover:bg-red-100",
      },
      size: {
        default: "h-11",
        sm: "h-10 min-h-10 px-3",
        lg: "h-12 min-h-12 px-5 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
