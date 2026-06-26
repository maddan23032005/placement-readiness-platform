import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatRelative(d: string | Date): string {
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.floor(Math.abs(diff) / 86400000);
  const hours = Math.floor(Math.abs(diff) / 3600000);
  const mins = Math.floor(Math.abs(diff) / 60000);
  if (diff < 0) return "Ended";
  if (days > 0) return `in ${days}d`;
  if (hours > 0) return `in ${hours}h`;
  return `in ${mins}m`;
}
