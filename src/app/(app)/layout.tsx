import AppShell from "@/components/app-shell";
import AppProviders from "@/components/providers/app-providers";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
    </AppProviders>
  );
}
