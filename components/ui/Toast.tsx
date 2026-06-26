"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

// Simple global toast store
let listeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

function notify(toastsNext: ToastItem[]) {
  toasts = toastsNext;
  listeners.forEach((l) => l(toasts));
}

export const toast = {
  success: (message: string) => addToast("success", message),
  error: (message: string) => addToast("error", message),
  warning: (message: string) => addToast("warning", message),
  info: (message: string) => addToast("info", message),
};

function addToast(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2);
  notify([...toasts, { id, type, message }]);
  setTimeout(() => notify(toasts.filter((t) => t.id !== id)), 4000);
}

const icons = {
  success: <CheckCircle size={16} className="text-[hsl(var(--success))] shrink-0" />,
  error: <XCircle size={16} className="text-[hsl(var(--error))] shrink-0" />,
  warning: <AlertTriangle size={16} className="text-[hsl(var(--warning))] shrink-0" />,
  info: <Info size={16} className="text-[hsl(var(--info))] shrink-0" />,
};

const borderMap = {
  success: "border-[hsl(var(--success)/0.3)]",
  error: "border-[hsl(var(--error)/0.3)]",
  warning: "border-[hsl(var(--warning)/0.3)]",
  info: "border-[hsl(var(--info)/0.3)]",
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    listeners.push(setItems);
    return () => { listeners = listeners.filter((l) => l !== setItems); };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={cn(
            "flex items-start gap-3 bg-white rounded-lg border px-4 py-3 shadow-md",
            "animate-in slide-in-from-right-4 duration-200",
            borderMap[t.type]
          )}
        >
          {icons[t.type]}
          <p className="flex-1 text-sm text-[hsl(var(--text-primary))]">{t.message}</p>
          <button
            onClick={() => notify(toasts.filter((x) => x.id !== t.id))}
            className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
