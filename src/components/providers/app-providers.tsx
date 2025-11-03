"use client";

import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DataProvider>{children}</DataProvider>
    </AuthProvider>
  );
}
