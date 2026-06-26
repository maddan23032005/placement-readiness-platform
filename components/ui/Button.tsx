import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary:
    "bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand-dark))] hover:shadow-md hover:-translate-y-px active:scale-[0.98] focus-visible:ring-[hsl(var(--brand)/0.4)]",
  secondary:
    "bg-[hsl(var(--surface-2))] text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--border))] hover:-translate-y-px active:scale-[0.98] focus-visible:ring-[hsl(var(--brand)/0.3)]",
  outline:
    "border border-[hsl(var(--border))] bg-white text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-2))] hover:-translate-y-px active:scale-[0.98] focus-visible:ring-[hsl(var(--brand)/0.3)]",
  destructive:
    "bg-[hsl(var(--error))] text-white hover:bg-[hsl(0_72%_44%)] hover:shadow-md hover:-translate-y-px active:scale-[0.98] focus-visible:ring-[hsl(var(--error)/0.4)]",
  ghost:
    "bg-transparent text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--text-primary))] active:scale-[0.98] focus-visible:ring-[hsl(var(--brand)/0.3)]",
};

const sizeClasses = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-10 px-5 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
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
      </button>
    );
  }
);
Button.displayName = "Button";
