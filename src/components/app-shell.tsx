"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { useTheme } from "@/context/theme-context";

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
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  const items = navigation.filter((item) => item.roles.includes(user.role));

  const baseBackground =
    theme === "dark"
      ? "bg-slate-950 text-slate-100"
      : "bg-slate-100 text-slate-900";
  const surfaceClass =
    theme === "dark"
      ? "bg-slate-900/70 border border-slate-800"
      : "bg-white shadow-lg border border-slate-200";
  const navItemActive =
    theme === "dark"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
      : "border-emerald-500/40 bg-emerald-50 text-emerald-700";
  const navItemInactive =
    theme === "dark"
      ? "border-transparent hover:border-slate-700 hover:bg-slate-900/70"
      : "border-transparent hover:border-slate-200 hover:bg-slate-100";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${baseBackground}`}>
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur ${
          theme === "dark"
            ? "border-slate-800 bg-slate-950/80"
            : "border-slate-200/80 bg-slate-50/90"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 text-lg font-semibold">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${
                theme === "dark"
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "bg-emerald-500/10 text-emerald-700"
              }`}
            >
              MB
            </span>
            Monte Billing
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                theme === "dark"
                  ? "border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-200"
                  : "border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600"
              }`}
            >
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </button>
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] sm:inline-flex ${
                theme === "dark"
                  ? "border-slate-800 text-slate-200"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              {user.role === "owner" ? "Zona admin" : "Colaborador"}
            </span>
            <span
              className={`hidden sm:inline-flex text-xs ${
                theme === "dark" ? "text-slate-200" : "text-slate-500"
              }`}
            >
              Fondo Monte:
              <strong
                className={`ml-2 ${
                  theme === "dark" ? "text-emerald-300" : "text-emerald-600"
                }`}
              >
                USD {pettyCash.balance.toFixed(2)}
              </strong>
            </span>
            <button
              onClick={() => logout()}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                theme === "dark"
                  ? "border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-200"
                  : "border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600"
              }`}
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-6 py-10">
        <nav className={`hidden w-60 flex-col gap-2 md:flex ${theme === "dark" ? "text-slate-200" : "text-slate-600"}`}>
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  active ? navItemActive : navItemInactive
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
                      ? navItemActive
                      : theme === "dark"
                        ? "border-slate-700 text-slate-200 hover:border-emerald-400"
                        : "border-slate-200 text-slate-600 hover:border-emerald-500"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className={`grid gap-8 ${surfaceClass} md:bg-transparent md:border-0 md:shadow-none md:p-0`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
