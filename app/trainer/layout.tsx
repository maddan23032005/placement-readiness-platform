import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN") {
    redirect("/student/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-[hsl(var(--bg))]">
      <Sidebar role={session.user.role as "TRAINER"} userName={session.user.name} />
      <main className="flex-1 p-8 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
