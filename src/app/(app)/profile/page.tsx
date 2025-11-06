"use client";

import { FormEvent, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { projects, invoices, payments, exchangeRates } = useData();
  const [message, setMessage] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const getRateToUsd = (currency: string) => {
    if (currency === "USD") return 1;
    const match = exchangeRates
      .filter((rate) => rate.fromCurrency === currency && rate.toCurrency === "USD")
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return match?.rate ?? 1;
  };

  const convertToUsd = (amount: number, currency: string) => {
    if (currency === "USD") return amount;
    return amount * getRateToUsd(currency);
  };

  const convertFromUsd = (amount: number, currency: string) => {
    if (currency === "USD") return amount;
    const rate = getRateToUsd(currency);
    return rate === 0 ? amount : amount / rate;
  };

  const allocationKey = (user.name ?? "").toLowerCase();
  const pendingUsd = invoices.reduce((total, invoice) => {
    const project = projects.find((item) => item.id === invoice.projectId);
    if (!project) return total;
    const allocation = project.allocations.find(
      (item) => item.name.toLowerCase() === allocationKey,
    );
    if (!allocation) return total;
    const baseShare = allocation.fixedAmount
      ? allocation.fixedAmount
      : ((allocation.percentage ?? 0) / 100) * invoice.total;
    const shareUsd = convertToUsd(baseShare, invoice.currency);
    const paidUsd = payments
      .filter((payment) => payment.invoiceId === invoice.id)
      .reduce((acc, payment) => {
        const split = payment.splits.find(
          (splitItem) => splitItem.name.toLowerCase() === allocationKey,
        );
        if (!split) return acc;
        return acc + convertToUsd(split.amount, payment.currency);
      }, 0);
    return total + Math.max(shareUsd - paidUsd, 0);
  }, 0);

  const pendingPreferred = convertFromUsd(pendingUsd, user.preferredCurrency);

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
    <section className="surface">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Mi perfil</h1>
          <p className="text-sm text-[color:var(--text-secondary)] max-w-2xl">
            Actualiza tus datos de contacto, preferencias y notificaciones para que el equipo pueda comunicarse sin fricciones.
          </p>
        </div>
        <div className="grid gap-3 text-right">
          <span className="tag">
            Rol ·
            {user.role === "admin"
              ? " Administrador"
              : user.role === "owner"
                ? " Owner"
                : " Colaborador"}
          </span>
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/80 px-4 py-3 text-sm text-[color:var(--text-secondary)]">
            <p className="text-xs uppercase tracking-[0.2em]">Pendiente por cobrar</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">
              USD {pendingUsd.toFixed(2)}
            </p>
            {user.preferredCurrency !== "USD" && (
              <p className="text-xs text-[color:var(--text-secondary)]">
                {user.preferredCurrency} {pendingPreferred.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className="surface-strong mt-6 border-emerald-400/60 text-sm text-[color:var(--text-secondary)]">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
          Nombre completo
          <input
            name="name"
            defaultValue={user.name}
            className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
          Teléfono
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
          Zona horaria
          <input
            name="timezone"
            defaultValue={user.timezone}
            className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
          Idioma/Locale
          <input
            name="locale"
            defaultValue={user.locale}
            className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
          Moneda preferida
          <select
            name="preferredCurrency"
            defaultValue={user.preferredCurrency}
            className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
          >
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
            <option value="COP">COP</option>
          </select>
        </label>
        <label className="md:col-span-2 grid gap-2 text-sm text-[color:var(--text-secondary)]">
          Información bancaria
          <textarea
            name="bankInfo"
            rows={3}
            defaultValue={user.bankInfo ?? ""}
            className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
          />
        </label>
        <fieldset className="grid gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-secondary)]">
          <legend className="px-2 text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Notificaciones</legend>
          <label className="flex items-center justify-between gap-3">
            <span>Email</span>
            <input type="checkbox" name="notifEmail" defaultChecked={user.notifications.email} className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Slack</span>
            <input type="checkbox" name="notifSlack" defaultChecked={user.notifications.slack} className="h-4 w-4" />
          </label>
        </fieldset>
        <button
          type="submit"
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          Guardar perfil
        </button>
      </form>
    </section>
  );
}
