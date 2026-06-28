"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children?: ReactNode;
}

const variantClasses = {
  primary:
    "bg-[hsl(var(--brand))] text-white shadow-sm hover:shadow-md hover:bg-[hsl(var(--brand-dark))] focus-visible:ring-[hsl(var(--brand)/0.4)]",
  secondary:
    "bg-[hsl(var(--surface-2))] text-[hsl(var(--text-primary))] shadow-sm border border-transparent hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-2))] focus-visible:ring-[hsl(var(--brand)/0.3)]",
  outline:
    "border border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-2))] focus-visible:ring-[hsl(var(--brand)/0.3)]",
  destructive:
    "bg-[hsl(var(--error))] text-white shadow-sm hover:shadow-md hover:bg-[hsl(0_72%_44%)] focus-visible:ring-[hsl(var(--error)/0.4)]",
  ghost:
    "bg-transparent text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--text-primary))] focus-visible:ring-[hsl(var(--brand)/0.3)]",
};

const sizeClasses = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileHover={disabled || loading ? {} : { y: -1, scale: 1.01 }}
        whileTap={disabled || loading ? {} : { scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...(props as any)}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
