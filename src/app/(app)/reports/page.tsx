"use client";

import { useMemo } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[color:var(--text-primary)]">{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const {
    invoices,
    payments,
    expenses,
    projects,
    balances,
    pettyCash,
    exchangeRates,
  } = useData();

  const selectedInvoices = useMemo(() => {
    if (user && user.role !== "collaborator") return invoices;
    if (!user) return [];
    return invoices.filter((invoice) =>
      projects
        .find((project) => project.id === invoice.projectId)
        ?.allocations.some((allocation) =>
          allocation.name.toLowerCase().includes((user.name ?? "").toLowerCase()),
        ),
    );
  }, [invoices, projects, user]);

  const arAging = useMemo(() => {
    const buckets = {
      "0-30": 0,
      "31-60": 0,
      "61-90": 0,
      "+90": 0,
    } as Record<string, number>;

    const today = new Date();
    selectedInvoices.forEach((invoice) => {
      if (invoice.status === "paid" || invoice.status === "void") return;
      const due = new Date(invoice.dueDate);
      const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const outstanding = invoice.total - payments
        .filter((payment) => payment.invoiceId === invoice.id)
        .reduce((acc, payment) => acc + payment.amount, 0);
      if (diff <= 30) buckets["0-30"] += outstanding;
      else if (diff <= 60) buckets["31-60"] += outstanding;
      else if (diff <= 90) buckets["61-90"] += outstanding;
      else buckets["+90"] += outstanding;
    });

    return buckets;
  }, [payments, selectedInvoices]);

  const margins = useMemo(() => {
    return projects.map((project) => {
      const projectInvoices = invoices.filter((invoice) => invoice.projectId === project.id);
      const projectExpenses = expenses.filter((expense) => expense.projectId === project.id);
      const totalInvoiced = projectInvoices.reduce((acc, invoice) => acc + invoice.total, 0);
      const totalExpenses = projectExpenses.reduce((acc, expense) => acc + expense.amount, 0);
      return {
        project,
        totalInvoiced,
        totalExpenses,
        margin: totalInvoiced - totalExpenses,
      };
    });
  }, [expenses, invoices, projects]);

  const handleExport = () => {
    const rows: string[][] = [
      ["Tipo", "Referencia", "Fecha", "Monto", "Moneda", "Detalle"],
      ...invoices.map((invoice) => [
        "Invoice",
        invoice.number,
        invoice.issueDate,
        invoice.total.toString(),
        invoice.currency,
        `${invoice.status} · ${invoice.projectId}`,
      ]),
      ...payments.map((payment) => [
        "Payment",
        payment.appliedTo,
        payment.date,
        payment.amount.toString(),
        payment.currency,
        `Petty ${payment.pettyContribution} | Splits ${payment.splits
          .map((split) => `${split.name}:${split.amount}`)
          .join(";")}`,
      ]),
      ...expenses.map((expense) => [
        "Expense",
        expense.description,
        expense.date,
        expense.amount.toString(),
        expense.currency,
        `${expense.category} · ${expense.projectId ?? "Sin proyecto"}`,
      ]),
    ];
    downloadCsv("monte-billing-report.csv", rows);
  };

  return (
    <div className="grid gap-8">
      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Reportes y balances</h1>
            <p className="text-sm text-[color:var(--text-secondary)] max-w-2xl">
              Visualiza AR Aging, márgenes por proyecto, balances personales y saldo del Fondo Monte.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-secondary)] transition hover:border-emerald-400"
          >
            Exportar CSV
          </button>
        </div>
        <div className="surface-muted mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Balance Milo" value={`USD ${(balances["Milo"] ?? 0).toFixed(2)}`} />
          <SummaryCard label="Balance Sergio" value={`USD ${(balances["Sergio"] ?? 0).toFixed(2)}`} />
          <SummaryCard label="Colaboradores" value={`USD ${(balances["Colaboradores"] ?? 0).toFixed(2)}`} />
          <SummaryCard label="Fondo Monte" value={`USD ${pettyCash.balance.toFixed(2)}`} />
        </div>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">AR Aging</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {Object.entries(arAging).map(([bucket, amount]) => (
            <div
              key={bucket}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4 text-center"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">{bucket} días</p>
              <p className="mt-2 text-lg font-semibold text-amber-600">{amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Margen por proyecto</h2>
        <div className="mt-4 grid gap-4">
          {margins.map(({ project, totalInvoiced, totalExpenses, margin }) => (
            <article
              key={project.id}
              className="grid gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-1">
                  <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{project.name}</h3>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    {project.currency} · Presupuesto {project.budget.toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-xs text-[color:var(--text-secondary)]">
                  <p>Facturado: {project.currency} {totalInvoiced.toLocaleString()}</p>
                  <p>Gastos: {project.currency} {totalExpenses.toLocaleString()}</p>
                  <p className={margin >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    Margen: {project.currency} {margin.toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Tipos de cambio registrados</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {exchangeRates.map((rate) => (
            <div
              key={rate.id}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
                {rate.fromCurrency} → {rate.toCurrency}
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">{rate.rate}</p>
              <p className="text-xs text-[color:var(--text-secondary)]">{rate.date}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
