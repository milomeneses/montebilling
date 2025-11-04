"use client";

import { FormEvent, useMemo } from "react";

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

export default function ExpensesPage() {
  const { user } = useAuth();
  const { expenses, addExpense, toggleExpenseApproval, projects } = useData();

  const filteredExpenses = useMemo(() => {
    if (user && user.role !== "collaborator") return expenses;
    if (!user) return [];
    return expenses.filter((expense) => expense.userId === user.id);
  }, [expenses, user]);

  const summary = useMemo(() => {
    if (filteredExpenses.length === 0) {
      return {
        totalsLabel: "Sin gastos",
        approvedLabel: "0 aprobados",
        pendingLabel: "0 pendientes",
      };
    }
    const totals = filteredExpenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.currency] = (acc[expense.currency] ?? 0) + expense.amount;
      return acc;
    }, {});
    const totalsLabel = Object.entries(totals)
      .map(([currency, value]) => `${currency} ${value.toLocaleString()}`)
      .join(" · ");
    const approved = filteredExpenses.filter((expense) => expense.approved).length;
    return {
      totalsLabel,
      approvedLabel: `${approved} aprobados`,
      pendingLabel: `${filteredExpenses.length - approved} pendientes`,
    };
  }, [filteredExpenses]);

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
      approved: user.role !== "collaborator",
      date,
    });
    event.currentTarget.reset();
  };

  return (
    <div className="grid gap-8">
      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Gastos</h1>
            <p className="text-sm text-[color:var(--text-secondary)] max-w-2xl">
              Controla gastos facturables y no facturables con adjuntos y aprobación del admin.
            </p>
          </div>
          <div className="tag">{filteredExpenses.length} registros</div>
        </div>
        <div className="surface-muted mt-6 grid gap-3 md:grid-cols-3">
          <SummaryCard label="Total declarado" value={summary.totalsLabel} />
          <SummaryCard label="Aprobados" value={summary.approvedLabel} />
          <SummaryCard label="Pendientes" value={summary.pendingLabel} />
        </div>
      </section>

      <section className="surface">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Registrar gasto</h2>
            <p className="text-xs text-[color:var(--text-secondary)]">
              Completa los campos y adjunta el enlace del comprobante si aplica.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Proyecto (opcional)
              <select
                name="projectId"
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              >
                <option value="">Sin proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
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
            Descripción
            <input
              name="description"
              required
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Categoría
              <input
                name="category"
                required
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Monto
              <input
                name="amount"
                type="number"
                step="0.01"
                min={0}
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
          </div>

          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Enlace del comprobante (opcional)
            <input
              name="receiptUrl"
              type="url"
              placeholder="https://..."
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>

          <button
            type="submit"
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Guardar gasto
          </button>
        </form>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Historial</h2>
        <div className="mt-4 grid gap-4">
          {filteredExpenses.map((expense) => {
            const project = expense.projectId
              ? projects.find((item) => item.id === expense.projectId)?.name
              : "Sin proyecto";
            return (
              <article
                key={expense.id}
                className="grid gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid gap-1">
                    <h3 className="text-base font-semibold text-[color:var(--text-primary)]">{expense.description}</h3>
                    <p className="text-xs text-[color:var(--text-secondary)]">{project}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                    <span className="tag">
                      {expense.currency} {expense.amount.toLocaleString()}
                    </span>
                    <span className="tag">{expense.category}</span>
                    <span className="tag">{expense.date}</span>
                  </div>
                </div>
                {expense.receiptUrl && (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-emerald-600 underline"
                  >
                    Ver comprobante
                  </a>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`rounded-full px-4 py-1 text-xs font-semibold ${
                    expense.approved
                      ? "border border-emerald-400/60 bg-emerald-50 text-emerald-600"
                      : "border border-amber-400/60 bg-amber-50 text-amber-600"
                  }`}
                  >
                    {expense.approved ? "Aprobado" : "Pendiente"}
                  </span>
                  {user && user.role !== "collaborator" && (
                    <button
                      onClick={() => toggleExpenseApproval(expense.id)}
                      className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)] hover:border-emerald-400"
                    >
                      {expense.approved ? "Revertir" : "Aprobar"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          {filteredExpenses.length === 0 && (
            <div className="surface-strong text-sm text-[color:var(--text-secondary)]">
              Todavía no registraste gastos.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
