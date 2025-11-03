"use client";

import { FormEvent, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

export default function SettingsPage() {
  const { user } = useAuth();
  const { pettyCash, updatePettyCashRule, addExchangeRate, exchangeRates } = useData();
  const [ruleType, setRuleType] = useState<"percent" | "fixed">(pettyCash.ruleType);
  const [ruleValue, setRuleValue] = useState<number>(pettyCash.value);

  if (user?.role !== "owner") {
    return (
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold">Configuración financiera</h1>
        <p className="text-sm text-slate-300">
          Solo los owners pueden modificar reglas de caja chica y tipos de cambio.
        </p>
      </section>
    );
  }

  const handleRuleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updatePettyCashRule({ ruleType, value: ruleValue });
  };

  const handleRateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fromCurrency = String(form.get("fromCurrency")) as "USD" | "ARS" | "COP";
    const toCurrency = String(form.get("toCurrency")) as "USD" | "ARS" | "COP";
    const rate = Number(form.get("rate"));
    const date = String(form.get("date"));
    addExchangeRate({ fromCurrency, toCurrency, rate, date });
    event.currentTarget.reset();
  };

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold">Configuración financiera</h1>
        <p className="text-sm text-slate-300">
          Define la regla de caja chica y registra nuevos tipos de cambio diarios.
        </p>

        <form onSubmit={handleRuleSubmit} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-2">
          <label className="grid gap-1 text-xs text-slate-400">
            Tipo de regla
            <select
              value={ruleType}
              onChange={(event) => setRuleType(event.target.value as "percent" | "fixed")}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="percent">Porcentaje del pago</option>
              <option value="fixed">Monto fijo</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Valor
            <input
              type="number"
              min={0}
              step="0.01"
              value={ruleValue}
              onChange={(event) => setRuleValue(Number(event.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <button
            type="submit"
            className="md:col-span-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Guardar regla de caja chica
          </button>
        </form>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Registrar tipo de cambio</h2>
        <form onSubmit={handleRateSubmit} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-4">
          <label className="grid gap-1 text-xs text-slate-400">
            Desde
            <select
              name="fromCurrency"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="COP">COP</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Hacia
            <select
              name="toCurrency"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="COP">COP</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Tasa
            <input
              name="rate"
              type="number"
              required
              step="0.0001"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
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
          <button
            type="submit"
            className="md:col-span-4 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Registrar tipo de cambio
          </button>
        </form>

        <div className="grid gap-2 text-xs text-slate-300">
          {exchangeRates.map((rate) => (
            <div
              key={rate.id}
              className="flex flex-wrap items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-2"
            >
              <span>
                {rate.date} · {rate.fromCurrency} → {rate.toCurrency}
              </span>
              <span>{rate.rate}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
