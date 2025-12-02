import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LanguageHtml } from "@/components/providers/LanguageHtml";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Devlogify",
  description: "Track your development projects and time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider>
            <DashboardLayout>
              {children}
            </DashboardLayout>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}