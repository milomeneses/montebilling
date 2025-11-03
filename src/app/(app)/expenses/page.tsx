"use client";

import { FormEvent, useMemo } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

export default function ExpensesPage() {
  const { user } = useAuth();
  const { expenses, addExpense, toggleExpenseApproval, projects } = useData();

  const filteredExpenses = useMemo(() => {
    if (user?.role === "owner") return expenses;
    if (!user) return [];
    return expenses.filter((expense) => expense.userId === user.id);
  }, [expenses, user]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const projectId = String(form.get("projectId")) || undefined;
    const description = String(form.get("description"));
    const category = String(form.get("category"));
    const amount = Number(form.get("amount"));
    const currency = String(form.get("currency")) as "USD" | "ARS" | "COP";
    const receiptUrl = String(form.get("receiptUrl"));
    const date = String(form.get("date"));
    addExpense({
      projectId,
      userId: user.id,
      description,
      category,
      amount,
      currency,
      receiptUrl,
      approved: user.role === "owner",
      date,
    });
    event.currentTarget.reset();
  };

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Gastos</h1>
            <p className="text-sm text-slate-300">
              Controla gastos facturables y no facturables con adjuntos y aprobación del admin.
            </p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
            {filteredExpenses.length} registros
          </span>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-xs text-slate-400">
              Proyecto (opcional)
              <select
                name="projectId"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">Sin proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
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
            Descripción
            <input
              name="description"
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-xs text-slate-400">
              Categoría
              <input
                name="category"
                defaultValue="Operativo"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
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
          </div>

          <label className="grid gap-1 text-xs text-slate-400">
            Enlace del comprobante
            <input
              name="receiptUrl"
              placeholder="https://drive.google.com/..."
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Registrar gasto
          </button>
        </form>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Historial</h2>
        <div className="grid gap-4">
          {filteredExpenses.map((expense) => {
            const project = projects.find((project) => project.id === expense.projectId);
            return (
              <article
                key={expense.id}
                className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{expense.description}</h3>
                    <p className="text-xs text-slate-400">
                      {project?.name ?? "Sin proyecto"} · {expense.category}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      {expense.currency} {expense.amount.toLocaleString()}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">{expense.date}</span>
                    <span
                      className={`rounded-full border px-3 py-1 ${
                        expense.approved
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                          : "border-amber-500/50 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {expense.approved ? "Aprobado" : "Pendiente"}
                    </span>
                  </div>
                </div>
                {expense.receiptUrl && (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-300 hover:underline"
                  >
                    Ver comprobante
                  </a>
                )}
                {user?.role === "owner" && (
                  <button
                    onClick={() => toggleExpenseApproval(expense.id)}
                    className="w-max rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400"
                  >
                    Alternar aprobación
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
