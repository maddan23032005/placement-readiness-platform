"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setErrors({ general: "Invalid email or password. Please try again." });
      return;
    }

    toast.success("Welcome back!");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[hsl(var(--text-primary))] tracking-tight mb-2">Sign in</h2>
        <p className="text-[hsl(var(--text-secondary))]">
          Enter your credentials to access your account.
        </p>
      </div>

      {errors.general && (
        <div role="alert" className="flex items-center gap-3 bg-[hsl(var(--error)/0.08)] border border-[hsl(var(--error)/0.2)] text-[hsl(var(--error))] text-sm rounded-xl px-4 py-3.5 mb-6 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="font-medium">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />
        </div>
        
        <div className="pt-2">
          <Button type="submit" loading={loading} className="w-full text-base font-semibold shadow-md hover:shadow-lg transition-all" size="lg">
            Sign in to account
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-[hsl(var(--border))] text-center">
        <p className="text-sm text-[hsl(var(--text-secondary))]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[hsl(var(--brand))] hover:text-[hsl(var(--brand-dark))] transition-colors">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
