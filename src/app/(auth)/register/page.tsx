"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth, type UserRole } from "@/context/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const role = String(form.get("role")) as UserRole;
    const timezone = String(form.get("timezone"));
    const preferredCurrency = String(form.get("preferredCurrency"));
    try {
      await register({ name, email, password, role, timezone, preferredCurrency });
      router.replace("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-semibold">Crear cuenta Monte Billing</h1>
        <p className="text-sm text-slate-300">
          Define tu rol para habilitar la zona de administración o el portal de colaborador.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <label className="grid gap-2 text-sm">
        Nombre completo
        <input
          name="name"
          required
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
        />
      </label>

      <label className="grid gap-2 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
        />
      </label>

      <label className="grid gap-2 text-sm">
        Contraseña
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
        />
      </label>

      <label className="grid gap-2 text-sm">
        Rol
        <select
          name="role"
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
        >
          <option value="admin">Administrador</option>
          <option value="owner">Owner</option>
          <option value="collaborator">Colaborador</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        Zona horaria
        <input
          name="timezone"
          defaultValue="America/Argentina/Buenos_Aires"
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
        />
      </label>

      <label className="grid gap-2 text-sm">
        Moneda preferida
        <select
          name="preferredCurrency"
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
        >
          <option value="USD">USD</option>
          <option value="ARS">ARS</option>
          <option value="COP">COP</option>
        </select>
      </label>

      <button
        type="submit"
        className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
      >
        Crear cuenta
      </button>

      <p className="text-center text-xs text-slate-400">
        ¿Ya tienes usuario? {" "}
        <Link href="/login" className="text-emerald-300 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
