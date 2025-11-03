"use client";

import { FormEvent, useState } from "react";

import { useAuth } from "@/context/auth-context";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateProfile({
      name: String(form.get("name")),
      phone: String(form.get("phone")),
      timezone: String(form.get("timezone")),
      preferredCurrency: String(form.get("preferredCurrency")),
      locale: String(form.get("locale")),
      bankInfo: String(form.get("bankInfo")),
      notifications: {
        email: form.get("notifEmail") === "on",
        slack: form.get("notifSlack") === "on",
      },
    });
    setMessage("Perfil actualizado correctamente");
  };

  return (
    <div className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Mi perfil</h1>
          <p className="text-sm text-slate-300">
            Actualiza tus datos de contacto, preferencias y notificaciones.
          </p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
          Rol: {user.role === "owner" ? "Owner" : "Colaborador"}
        </span>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-xs text-slate-400">
          Nombre completo
          <input
            name="name"
            defaultValue={user.name}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="grid gap-1 text-xs text-slate-400">
          Teléfono
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="grid gap-1 text-xs text-slate-400">
          Zona horaria
          <input
            name="timezone"
            defaultValue={user.timezone}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="grid gap-1 text-xs text-slate-400">
          Idioma/Locale
          <input
            name="locale"
            defaultValue={user.locale}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="grid gap-1 text-xs text-slate-400">
          Moneda preferida
          <select
            name="preferredCurrency"
            defaultValue={user.preferredCurrency}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
            <option value="COP">COP</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-slate-400">
          Información bancaria
          <textarea
            name="bankInfo"
            rows={3}
            defaultValue={user.bankInfo ?? ""}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <div className="grid gap-2 text-xs text-slate-400">
          Notificaciones
          <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-200">
            <input type="checkbox" name="notifEmail" defaultChecked={user.notifications.email} />
            Email
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-200">
            <input type="checkbox" name="notifSlack" defaultChecked={user.notifications.slack} />
            Slack
          </label>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          Guardar perfil
        </button>
      </form>
    </div>
  );
}
