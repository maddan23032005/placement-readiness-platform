import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/trainer/dashboard");

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[hsl(var(--bg))]">
      <Sidebar role="STUDENT" userName={session.user.name || "Student"} />
      <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
