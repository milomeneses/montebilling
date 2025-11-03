import AppProviders from "@/components/providers/app-providers";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
          {children}
        </div>
      </div>
    </AppProviders>
  );
}
