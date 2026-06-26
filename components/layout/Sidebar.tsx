"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard, ClipboardList, BookOpen, Users, BarChart2,
  LogOut, ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: <LayoutDashboard size={17} /> },
  { label: "My Tests", href: "/student/tests", icon: <ClipboardList size={17} /> },
];

const trainerNav: NavItem[] = [
  { label: "Dashboard", href: "/trainer/dashboard", icon: <LayoutDashboard size={17} /> },
  { label: "Tests", href: "/trainer/tests", icon: <ClipboardList size={17} /> },
  { label: "Question Bank", href: "/trainer/questions", icon: <BookOpen size={17} /> },
  { label: "Batches", href: "/trainer/batches", icon: <Users size={17} /> },
];

interface SidebarProps {
  role: "STUDENT" | "TRAINER" | "SUPER_ADMIN";
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "STUDENT" ? studentNav : trainerNav;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[hsl(var(--brand))] rounded-lg flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 6l7 4 7-4" stroke="white" strokeWidth="1.5"/>
              <path d="M9 10v6" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-[hsl(var(--text-primary))] tracking-tight leading-none">
            PRP
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5" aria-label="Main navigation">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", active && "active")}
            >
              {item.icon}
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-[hsl(var(--border))]">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="w-7 h-7 bg-[hsl(var(--brand-light))] rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-[hsl(var(--brand))]">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate leading-none">{userName}</p>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5 capitalize">{role.toLowerCase()}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[hsl(var(--text-secondary))]"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={15} />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
