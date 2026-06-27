import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SWCleanup } from "@/components/SWCleanup";

export const metadata: Metadata = {
  title: {
    template: "%s | Placement Readiness Platform",
    default: "Placement Readiness Platform",
  },
  description:
    "A professional assessment platform for campus placement preparation.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <SWCleanup />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SessionProvider>
            {children}
            <ToastContainer />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
