import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
  padding?: boolean;
}

export function Card({ className, children, padding = true }: CardProps) {
  return (
    <div className={cn("card", padding && "p-6", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex items-center justify-between mb-5", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h3 className={cn("text-base font-semibold text-[hsl(var(--text-primary))]", className)}>
      {children}
    </h3>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(className)}>{children}</div>;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-[hsl(var(--text-muted))] mb-4">{icon}</div>
      <p className="text-sm font-medium text-[hsl(var(--text-primary))] mb-1">{title}</p>
      {description && <p className="text-xs text-[hsl(var(--text-muted))] max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
