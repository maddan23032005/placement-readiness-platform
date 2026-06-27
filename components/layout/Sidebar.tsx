"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard, ClipboardList, BookOpen, Users, BarChart2,
  LogOut, ChevronRight, Menu, X
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

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
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-4 py-5 border-b border-[hsl(var(--border))] flex justify-between items-center h-16 md:h-auto">
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
        <button className="md:hidden text-[hsl(var(--text-secondary))]" onClick={() => setIsOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 relative px-2 overflow-y-auto" aria-label="Main navigation">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group z-10",
                active ? "text-[hsl(var(--brand))]" : "text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-[hsl(var(--brand-light))] rounded-lg border border-[hsl(var(--brand))/0.15] shadow-[inset_0_2px_4px_0_hsl(var(--brand)/0.04)] -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              {!active && (
                <div className="absolute inset-0 bg-[hsl(var(--surface-2))] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
              )}
              
              <div className={cn(
                "transition-transform duration-200",
                !active && "group-hover:scale-110"
              )}>
                {item.icon}
              </div>
              
              <span className="relative">{item.label}</span>
              
              {active && (
                <ChevronRight size={14} className="ml-auto opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-[hsl(var(--border))] mt-auto">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="w-7 h-7 bg-[hsl(var(--brand-light))] rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-[hsl(var(--brand))]">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate leading-none">{userName}</p>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5 capitalize">{role.toLowerCase()}</p>
          </div>
          <ThemeToggle />
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
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] flex items-center justify-between px-4 z-40">
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
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-2))] rounded-lg">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))] flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>
    </>
  );
}
