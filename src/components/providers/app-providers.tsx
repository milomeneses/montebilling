"use client";

import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";
import { ThemeProvider } from "@/context/theme-context";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>{children}</DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
