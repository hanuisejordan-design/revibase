import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-brand text-brand-foreground hover:bg-brand-hover",
        variant === "secondary" && "border-border text-foreground hover:bg-background border",
        className,
      )}
      {...props}
    />
  );
}
