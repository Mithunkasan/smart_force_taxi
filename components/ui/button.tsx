import React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer",
        {
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:glow-primary border border-primary/10":
            variant === "default",
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90":
            variant === "destructive",
          "border border-border bg-transparent shadow-sm hover:bg-muted hover:text-accent-foreground":
            variant === "outline",
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-muted border border-border/40":
            variant === "secondary",
          "hover:bg-muted hover:text-accent-foreground": variant === "ghost",
          "text-primary underline-offset-4 hover:underline bg-transparent":
            variant === "link",
        },
        {
          "h-10 px-4 py-2": size === "default",
          "h-9 rounded-md px-3 text-xs": size === "sm",
          "h-11 rounded-md px-8": size === "lg",
          "h-10 w-10": size === "icon",
        },
        className
      )}
      {...props}
    />
  );
}
