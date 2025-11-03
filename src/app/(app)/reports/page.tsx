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
    if (user?.role === "owner") return invoices;
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
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Reportes y balances</h1>
            <p className="text-sm text-slate-300">
              Visualiza AR Aging, márgenes por proyecto, balances personales y saldo del Fondo Monte.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 hover:border-emerald-400"
          >
            Exportar CSV
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Balance Milo</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              USD {(balances["Milo"] ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Balance Sergio</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              USD {(balances["Sergio"] ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Colaboradores</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              USD {(balances["Colaboradores"] ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Fondo Monte</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              USD {pettyCash.balance.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">AR Aging</h2>
        <div className="grid gap-3 md:grid-cols-4">
          {Object.entries(arAging).map(([bucket, amount]) => (
            <div
              key={bucket}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{bucket} días</p>
              <p className="mt-2 text-lg font-semibold text-amber-200">
                {amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Margen por proyecto</h2>
        <div className="grid gap-4">
          {margins.map(({ project, totalInvoiced, totalExpenses, margin }) => (
            <article
              key={project.id}
              className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{project.name}</h3>
                  <p className="text-xs text-slate-400">
                    {project.currency} · Presupuesto {project.budget.toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-300">
                  <p>Facturado: {project.currency} {totalInvoiced.toLocaleString()}</p>
                  <p>Gastos: {project.currency} {totalExpenses.toLocaleString()}</p>
                  <p className={margin >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    Margen: {project.currency} {margin.toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Tipos de cambio registrados</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {exchangeRates.map((rate) => (
            <div
              key={rate.id}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {rate.fromCurrency} → {rate.toCurrency}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-200">{rate.rate}</p>
              <p className="text-xs text-slate-500">{rate.date}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
