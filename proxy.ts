import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes and API routes — allow proxy to pass them (API routes do their own auth in Node runtime)
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const session = await auth();

  // Not authenticated
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.role ?? "";

  // Trainer-only routes
  if (
    pathname.startsWith("/trainer") &&
    role !== "TRAINER" &&
    role !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  // Student-only routes
  if (pathname.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/trainer/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|images).*)"],
};
