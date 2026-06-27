"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type, ...props }, ref) => {
    const [showPwd, setShowPwd] = useState(false);
    const isPassword = type === "password";

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={isPassword ? (showPwd ? "text" : "password") : type}
            className={cn("field", error && "field-error", isPassword && "pr-10", className)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="hint-error">{error}</p>}
        {hint && !error && <p className="text-xs text-[hsl(var(--text-muted))] mt-1">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps {
  label?: string;
  error?: string;
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export function Select({ label, error, id, value, onChange, options, placeholder, className }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label htmlFor={id} className="label">{label}</label>}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("field appearance-none bg-[hsl(var(--surface))]", error && "field-error", className)}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="hint-error">{error}</p>}
    </div>
  );
}

interface TextareaProps {
  label?: string;
  error?: string;
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function Textarea({ label, error, id, value, onChange, placeholder, rows = 3, className }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && <label htmlFor={id} className="label">{label}</label>}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn("field resize-none", error && "field-error", className)}
      />
      {error && <p className="hint-error">{error}</p>}
    </div>
  );
}
