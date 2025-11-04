"use client";

import { FormEvent } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-4 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[color:var(--text-primary)]">{value}</p>
    </div>
  );
}

export default function AdjustmentsPage() {
  const { user } = useAuth();
  const { adjustments, addAdjustment } = useData();

  if (!user || user.role === "collaborator") {
    return (
      <section className="surface">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Notas y ajustes</h1>
        <p className="text-sm text-[color:var(--text-secondary)] max-w-xl">
          Solo la administración puede crear asientos contables internos entre cuentas.
        </p>
      </section>
    );
  }

  const totalPorCuenta = adjustments.reduce<Record<string, number>>((acc, adjustment) => {
    acc[adjustment.to] = (acc[adjustment.to] ?? 0) + adjustment.amount;
    acc[adjustment.from] = (acc[adjustment.from] ?? 0) - adjustment.amount;
    return acc;
  }, {});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const from = String(form.get("from"));
    const to = String(form.get("to"));
    const amount = Number(form.get("amount"));
    const currency = String(form.get("currency")) as "USD" | "ARS" | "COP";
    const category = String(form.get("category"));
    const note = String(form.get("note"));
    const date = String(form.get("date"));
    addAdjustment({ from, to, amount, currency, category, note, date });
    event.currentTarget.reset();
  };

  return (
    <div className="grid gap-8">
      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Notas y ajustes</h1>
            <p className="text-sm text-[color:var(--text-secondary)] max-w-2xl">
              Registra transferencias internas como “Sergio → Milo” o reintegros para reflejar balances personales.
            </p>
          </div>
          <div className="tag">{adjustments.length} asientos</div>
        </div>
        <div className="surface-muted mt-6 grid gap-3 md:grid-cols-3">
          <SummaryCard label="Entradas Milo" value={`${(totalPorCuenta["Milo"] ?? 0).toLocaleString()} USD`} />
          <SummaryCard label="Entradas Sergio" value={`${(totalPorCuenta["Sergio"] ?? 0).toLocaleString()} USD`} />
          <SummaryCard label="Monte" value={`${(totalPorCuenta["Monte"] ?? 0).toLocaleString()} USD`} />
        </div>
      </section>

      <section className="surface">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Crear ajuste</h2>
            <p className="text-xs text-[color:var(--text-secondary)]">
              Define el origen, destino y concepto del movimiento.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Desde
              <input
                name="from"
                required
                defaultValue="Sergio"
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Hacia
              <input
                name="to"
                required
                defaultValue="Milo"
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Monto
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Moneda
              <select
                name="currency"
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="COP">COP</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Fecha
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Categoría
            <input
              name="category"
              defaultValue="Reintegro"
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>

          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Nota
            <textarea
              name="note"
              rows={3}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>

          <button
            type="submit"
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Guardar ajuste
          </button>
        </form>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Historial de asientos</h2>
        <div className="mt-4 grid gap-4">
          {adjustments.map((adjustment) => (
            <article
              key={adjustment.id}
              className="grid gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-1">
                  <h3 className="text-base font-semibold text-[color:var(--text-primary)]">
                    {adjustment.from} → {adjustment.to}
                  </h3>
                  <p className="text-xs text-[color:var(--text-secondary)]">{adjustment.category}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  <span className="tag">
                    {adjustment.currency} {adjustment.amount.toLocaleString()}
                  </span>
                  <span className="tag">{adjustment.date}</span>
                </div>
              </div>
              <p className="text-sm text-[color:var(--text-secondary)]">{adjustment.note}</p>
            </article>
          ))}
          {adjustments.length === 0 && (
            <div className="surface-strong text-sm text-[color:var(--text-secondary)]">
              Aún no registraste ajustes internos.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
