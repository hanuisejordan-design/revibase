import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-border bg-surface w-full rounded-lg border px-3 py-2 text-sm",
        "placeholder:text-muted focus:border-brand focus:ring-brand/20 focus:ring-2 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
