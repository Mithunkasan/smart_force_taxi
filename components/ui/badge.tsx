import React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-primary/10 text-primary border border-primary/20": variant === "default",
          "bg-secondary text-secondary-foreground border border-border": variant === "secondary",
          "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20": variant === "success",
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20": variant === "warning",
          "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20": variant === "danger",
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20": variant === "info",
          "text-foreground border border-border": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
