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
    <Card>
      <h1 className="text-xl font-bold text-[hsl(var(--text-primary))] mb-1">Sign in</h1>
      <p className="text-sm text-[hsl(var(--text-secondary))] mb-6">
        Enter your credentials to access the platform.
      </p>

      {errors.general && (
        <div role="alert" className="flex items-center gap-2 bg-[hsl(var(--error)/0.08)] border border-[hsl(var(--error)/0.3)] text-[hsl(var(--error))] text-sm rounded-lg px-4 py-3 mb-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-[hsl(var(--text-secondary))] mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-[hsl(var(--brand))] hover:underline">
          Create one
        </Link>
      </p>
    </Card>
  );
}
