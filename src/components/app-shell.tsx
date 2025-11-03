"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

const navigation = [
  { href: "/dashboard", label: "Dashboard", roles: ["owner", "collaborator"] },
  { href: "/clients", label: "Clientes", roles: ["owner"] },
  { href: "/projects", label: "Proyectos", roles: ["owner", "collaborator"] },
  { href: "/invoices", label: "Invoices", roles: ["owner"] },
  { href: "/payments", label: "Pagos", roles: ["owner", "collaborator"] },
  { href: "/expenses", label: "Gastos", roles: ["owner", "collaborator"] },
  { href: "/adjustments", label: "Notas y ajustes", roles: ["owner"] },
  { href: "/reports", label: "Reportes", roles: ["owner", "collaborator"] },
  { href: "/import", label: "Importador CSV", roles: ["owner"] },
  { href: "/settings", label: "Configuración", roles: ["owner"] },
  { href: "/profile", label: "Mi perfil", roles: ["owner", "collaborator"] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { pettyCash } = useData();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  const items = navigation.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              MB
            </span>
            Monte Billing
          </Link>
          <div className="flex items-center gap-6 text-sm text-slate-300">
            <span className="hidden items-center gap-2 rounded-full border border-slate-800 px-3 py-1 text-xs uppercase tracking-[0.3em] sm:inline-flex">
              {user.role === "owner" ? "Zona admin" : "Colaborador"}
            </span>
            <span className="hidden sm:inline-flex">
              Fondo Monte: <strong className="ml-2 text-emerald-300">USD {pettyCash.balance.toFixed(2)}</strong>
            </span>
            <button
              onClick={() => logout()}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-emerald-400 hover:text-emerald-200"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-6 py-10">
        <nav className="hidden w-56 flex-col gap-2 md:flex">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                    : "border-transparent hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1">
          <div className="mb-6 flex flex-wrap items-center gap-3 md:hidden">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-800 text-slate-300 hover:border-emerald-400"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="grid gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
