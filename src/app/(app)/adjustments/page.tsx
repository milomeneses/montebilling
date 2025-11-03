"use client";

import { FormEvent } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

export default function AdjustmentsPage() {
  const { user } = useAuth();
  const { adjustments, addAdjustment } = useData();

  if (user?.role !== "owner") {
    return (
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold">Notas y ajustes</h1>
        <p className="text-sm text-slate-300">
          Solo los owners pueden crear asientos contables internos entre cuentas.
        </p>
      </section>
    );
  }

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
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Notas y ajustes</h1>
            <p className="text-sm text-slate-300">
              Registra transferencias internas como “Sergio → Milo” o reintegros para reflejar balances personales.
            </p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
            {adjustments.length} asientos
          </span>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-xs text-slate-400">
              Desde
              <input
                name="from"
                required
                defaultValue="Sergio"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              Hacia
              <input
                name="to"
                required
                defaultValue="Milo"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-xs text-slate-400">
              Monto
              <input
                name="amount"
                type="number"
                required
                step="0.01"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              Moneda
              <select
                name="currency"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="COP">COP</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              Fecha
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          </div>

          <label className="grid gap-1 text-xs text-slate-400">
            Categoría
            <input
              name="category"
              defaultValue="Reintegro"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="grid gap-1 text-xs text-slate-400">
            Nota
            <textarea
              name="note"
              rows={2}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Registrar ajuste
          </button>
        </form>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Ledger</h2>
        <div className="grid gap-4">
          {adjustments.map((adjustment) => (
            <article
              key={adjustment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {adjustment.from} → {adjustment.to}
                </h3>
                <p className="text-xs text-slate-400">
                  {adjustment.category} · {adjustment.date}
                </p>
              </div>
              <div className="text-right text-sm text-slate-200">
                <p>
                  {adjustment.currency} {adjustment.amount.toLocaleString()}
                </p>
                {adjustment.note && (
                  <p className="text-xs text-slate-400">{adjustment.note}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
