"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleGoogle = async () => {
    const email = prompt("Introduce tu correo de Google Workspace") ?? "";
    if (!email) return;
    try {
      await loginWithGoogle(email);
      router.replace("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-semibold">Ingresar a Monte Billing</h1>
        <p className="text-sm text-slate-300">
          Usa tu cuenta de Monte Animation o un correo autorizado para continuar.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

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
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
        />
      </label>

      <button
        type="submit"
        className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
      >
        Entrar
      </button>

      <button
        type="button"
        onClick={handleGoogle}
        className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400"
      >
        Continuar con Google
      </button>

      <p className="text-center text-xs text-slate-400">
        ¿No tienes cuenta? {" "}
        <Link href="/register" className="text-emerald-300 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
