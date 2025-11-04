"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { useTheme } from "@/context/theme-context";

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  const value =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized;
  const bigint = Number.parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["admin", "owner", "collaborator"],
  },
  { href: "/clients", label: "Clientes", roles: ["admin", "owner"] },
  {
    href: "/projects",
    label: "Proyectos",
    roles: ["admin", "owner", "collaborator"],
  },
  { href: "/invoices", label: "Invoices", roles: ["admin", "owner"] },
  {
    href: "/payments",
    label: "Pagos",
    roles: ["admin", "owner", "collaborator"],
  },
  {
    href: "/expenses",
    label: "Gastos",
    roles: ["admin", "owner", "collaborator"],
  },
  { href: "/adjustments", label: "Notas y ajustes", roles: ["admin", "owner"] },
  {
    href: "/reports",
    label: "Reportes",
    roles: ["admin", "owner", "collaborator"],
  },
  { href: "/import", label: "Importador CSV", roles: ["admin", "owner"] },
  { href: "/settings", label: "Configuración", roles: ["admin", "owner"] },
  {
    href: "/profile",
    label: "Mi perfil",
    roles: ["admin", "owner", "collaborator"],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { pettyCash, appTemplate } = useData();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.fontFamily = appTemplate.fontFamily;
  }, [appTemplate.fontFamily]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const existing = document.querySelectorAll("[data-template-html='true']");
    existing.forEach((node) => node.parentElement?.removeChild(node));
    const html = appTemplate.customHtml?.trim();
    if (!html) return;
    const container = document.createElement("div");
    container.setAttribute("data-template-html", "true");
    container.innerHTML = html;
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  }, [appTemplate.customHtml]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  const items = navigation.filter((item) => item.roles.includes(user.role));

  const accent = appTemplate.primaryColor || "#10b981";
  const accentContrast = appTemplate.secondaryColor || "#0f172a";
  const accentSoft = hexToRgba(accent, 0.12);

  const baseBackground =
    theme === "dark"
      ? "bg-slate-950 text-slate-100"
      : "bg-slate-100 text-slate-900";
  const surfaceClass =
    theme === "dark"
      ? "bg-slate-900/70 border border-slate-800"
      : "bg-white shadow-lg border border-slate-200";
  const navItemInactive =
    theme === "dark"
      ? "border-transparent hover:border-slate-700 hover:bg-slate-900/70"
      : "border-transparent hover:border-slate-200 hover:bg-slate-100";

  return (
    <div
      className={`flex min-h-screen flex-col overflow-x-hidden transition-colors duration-300 ${baseBackground}`}
      style={{ minHeight: "100vh" }}
    >
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur ${
          theme === "dark"
            ? "border-slate-800 bg-slate-950/80"
            : "border-slate-200/80 bg-slate-50/90"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 text-lg font-semibold">
            {appTemplate.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={appTemplate.logoDataUrl}
                alt="Logo Monte Billing"
                className="h-10 w-10 rounded-2xl object-cover"
              />
            ) : (
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold"
                style={{
                  background: accentSoft,
                  color: accentContrast,
                  border: `1px solid ${accent}`,
                }}
              >
                MB
              </span>
            )}
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
              {user.role === "collaborator"
                ? "Colaborador"
                : user.role === "owner"
                  ? "Zona owner"
                  : "Administrador"}
            </span>
            <span
              className={`hidden sm:inline-flex text-xs ${
                theme === "dark" ? "text-slate-200" : "text-slate-500"
              }`}
            >
              Fondo Monte:
              <strong className="ml-2" style={{ color: accent }}>
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
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="mx-auto flex w-full max-w-6xl gap-8 px-6 py-10">
          <nav className={`hidden w-60 flex-col gap-2 md:flex ${theme === "dark" ? "text-slate-200" : "text-slate-600"}`}>
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${navItemInactive}`}
                style={
                  active
                    ? {
                        borderColor: accent,
                        background: accentSoft,
                        color: accentContrast,
                        boxShadow: `0 0 0 1px ${accentSoft}`,
                      }
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3 md:hidden">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    theme === "dark"
                      ? "border-slate-700 text-slate-200 hover:border-slate-500"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                  style={
                    active
                      ? {
                          borderColor: accent,
                          background: accentSoft,
                          color: accentContrast,
                        }
                      : undefined
                  }
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
    </div>
  );
}
