"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex flex-col md:flex-row overflow-hidden">
      {/* Left section: Branding & Animation (hidden on small screens) */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-[hsl(var(--brand-dark))] to-[hsl(var(--brand))] text-white relative overflow-hidden"
      >
        {/* Decorative background shapes */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[hsl(var(--brand-light))]/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="hsl(var(--brand))" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 6l7 4 7-4" stroke="hsl(var(--brand))" strokeWidth="1.5"/>
              <path d="M9 10v6" stroke="hsl(var(--brand))" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">PRP</span>
        </div>

        <div className="relative z-10 mb-20">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold leading-tight mb-6"
          >
            {isLogin ? "Welcome back to your preparation journey." : "Start your placement preparation journey."}
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-white/80 max-w-md"
          >
            Master coding interviews, practice MCQs, and track your progress with our intelligent platform.
          </motion.p>
        </div>

        <div className="relative z-10 text-sm text-white/60 font-medium">
          © {new Date().getFullYear()} Placement Readiness Platform
        </div>
      </motion.div>

      {/* Right section: Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 xl:px-32 relative">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Header (visible only on small screens) */}
          <div className="md:hidden text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[hsl(var(--brand))] rounded-lg flex items-center justify-center shadow-md">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M2 6l7 4 7-4" stroke="white" strokeWidth="1.5"/>
                  <path d="M9 10v6" stroke="white" strokeWidth="1.5"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-[hsl(var(--text-primary))] tracking-tight">PRP</span>
            </div>
          </div>
          
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
