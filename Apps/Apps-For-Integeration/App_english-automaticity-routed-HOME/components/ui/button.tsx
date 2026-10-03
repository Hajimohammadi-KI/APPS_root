import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "soft";
  size?: "default" | "sm" | "icon";
};

export function Button({ className, variant = "default", size = "default", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn("ui-button", `button-${variant}`, `button-${size}`, className)} {...props} />;
}
