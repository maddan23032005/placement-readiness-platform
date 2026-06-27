"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Role = "STUDENT" | "TRAINER";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("STUDENT");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    rollNumber: "", branch: "", gradYear: "",
    department: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    if (!form.password || form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role,
          rollNumber: form.rollNumber || undefined,
          branch: form.branch || undefined,
          gradYear: form.gradYear ? Number(form.gradYear) : undefined,
          department: form.department || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error) setErrors({ general: data.error });
        setLoading(false);
        return;
      }

      // Auto-login after signup
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      toast.success("Account created successfully!");
      router.push("/");
      router.refresh();
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[hsl(var(--text-primary))] tracking-tight mb-2">Create an account</h2>
        <p className="text-[hsl(var(--text-secondary))]">
          Join the platform as a student or trainer.
        </p>
      </div>

      {/* Role selector */}
      <div className="flex rounded-xl border border-[hsl(var(--border))] p-1.5 mb-6 bg-[hsl(var(--surface-2))] shadow-inner">
        {(["STUDENT", "TRAINER"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
              role === r
                ? "bg-[hsl(var(--surface))] text-[hsl(var(--brand))] shadow-sm"
                : "text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
            )}
          >
            {r === "STUDENT" ? "Student" : "Trainer / Faculty"}
          </button>
        ))}
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
          <Input id="name" label="Full name" placeholder="Your name" type="text"
            value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
          <Input id="email" label="Email address" placeholder="you@example.com" type="email"
            value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} autoComplete="email" />
          <Input id="password" label="Password" type="password" placeholder="Min. 8 characters"
            value={form.password} onChange={(e) => set("password", e.target.value)} error={errors.password} autoComplete="new-password" />

          {/* Role-specific fields */}
          {role === "STUDENT" && (
            <div className="space-y-4 pt-4 mt-2 border-t border-[hsl(var(--border))]">
              <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider">
                Student details
              </p>
              <Input id="rollNumber" label="Roll number" placeholder="e.g. 21CS001" type="text"
                value={form.rollNumber} onChange={(e) => set("rollNumber", e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input id="branch" label="Branch" placeholder="e.g. CSE" type="text"
                  value={form.branch} onChange={(e) => set("branch", e.target.value)} />
                <Input id="gradYear" label="Graduation year" placeholder="e.g. 2026" type="number"
                  value={form.gradYear} onChange={(e) => set("gradYear", e.target.value)} />
              </div>
            </div>
          )}

          {role === "TRAINER" && (
            <div className="space-y-4 pt-4 mt-2 border-t border-[hsl(var(--border))]">
              <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider">
                Trainer details
              </p>
              <Input id="department" label="Department" placeholder="e.g. Computer Science"
                type="text" value={form.department} onChange={(e) => set("department", e.target.value)} />
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button type="submit" loading={loading} className="w-full text-base font-semibold shadow-md hover:shadow-lg transition-all" size="lg">
            Create account
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-[hsl(var(--border))] text-center">
        <p className="text-sm text-[hsl(var(--text-secondary))]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[hsl(var(--brand))] hover:text-[hsl(var(--brand-dark))] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
