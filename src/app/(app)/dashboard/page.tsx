"use client";

import { useMemo } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

function convertToUsd(amount: number, currency: string, rates: ReturnType<typeof useData>["exchangeRates"]) {
  if (currency === "USD") return amount;
  const match = [...rates]
    .filter(
      (rate) => rate.fromCurrency === currency && rate.toCurrency === "USD",
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return amount * (match?.rate ?? 1);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { invoices, payments, expenses, balances, projects, exchangeRates } =
    useData();

  const metrics = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const invoicedThisMonth = invoices
      .filter((invoice) => invoice.issueDate.startsWith(monthKey))
      .reduce((acc, invoice) => acc + convertToUsd(invoice.total, invoice.currency, exchangeRates), 0);

    const outstanding = invoices.reduce((acc, invoice) => {
      if (invoice.status === "void" || invoice.status === "paid") return acc;
      const paid = payments
        .filter((payment) => payment.invoiceId === invoice.id)
        .reduce((sum, payment) => sum + payment.amount, 0);
      const remaining = Math.max(invoice.total - paid, 0);
      return acc + convertToUsd(remaining, invoice.currency, exchangeRates);
    }, 0);

    const expensesMonth = expenses
      .filter((expense) => expense.date.startsWith(monthKey))
      .reduce(
        (acc, expense) => acc + convertToUsd(expense.amount, expense.currency, exchangeRates),
        0,
      );

    const overdueInvoices = invoices.filter((invoice) => {
      if (invoice.status === "paid" || invoice.status === "void") return false;
      const due = new Date(invoice.dueDate);
      return due < now;
    });

    const marginByProject = projects.map((project) => {
      const projectInvoices = invoices.filter((invoice) => invoice.projectId === project.id);
      const totalInvoiced = projectInvoices.reduce(
        (acc, invoice) => acc + convertToUsd(invoice.total, invoice.currency, exchangeRates),
        0,
      );
      const projectExpenses = expenses.filter((expense) => expense.projectId === project.id);
      const totalExpenses = projectExpenses.reduce(
        (acc, expense) => acc + convertToUsd(expense.amount, expense.currency, exchangeRates),
        0,
      );
      const margin = totalInvoiced - totalExpenses;
      return {
        project,
        totalInvoiced,
        totalExpenses,
        margin,
      };
    });

    return {
      invoicedThisMonth,
      outstanding,
      expensesMonth,
      overdueInvoices,
      marginByProject,
    };
  }, [exchangeRates, expenses, invoices, payments, projects]);

  const personalBalance = balances[user?.name ?? ""] ?? 0;

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard financiero</h1>
        <p className="text-sm text-slate-300">
          KPIs en tiempo real para Monte Animation. Todo lo que antes vivía en el Excel ahora está centralizado en esta aplicación web.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Facturado este mes</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">USD {metrics.invoicedThisMonth.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total por cobrar</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">USD {metrics.outstanding.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Gastos del mes</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">USD {metrics.expensesMonth.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Balance personal</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">USD {personalBalance.toFixed(2)}</p>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Invoices vencidas</h2>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
            {metrics.overdueInvoices.length} pendientes
          </span>
        </div>
        <div className="grid gap-3">
          {metrics.overdueInvoices.length === 0 && (
            <p className="text-sm text-slate-400">No hay facturas vencidas. ¡Excelente!</p>
          )}
          {metrics.overdueInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-200">{invoice.number}</p>
                <p className="text-xs text-slate-400">
                  Vencía el {new Date(invoice.dueDate).toLocaleDateString()} · Estado {invoice.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-amber-200">
                  {invoice.currency} {invoice.total.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                  Pendiente: {invoice.total - payments
                    .filter((payment) => payment.invoiceId === invoice.id)
                    .reduce((sum, payment) => sum + payment.amount, 0)}
                  {" "}
                  {invoice.currency}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold">Margen por proyecto</h2>
        <div className="grid gap-3">
          {metrics.marginByProject.map(({ project, totalInvoiced, totalExpenses, margin }) => (
            <div
              key={project.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-100">{project.name}</p>
                <p className="text-xs text-slate-400">
                  Cliente: {project.clientId} · Estado {project.status.toUpperCase()}
                </p>
              </div>
              <div className="text-right text-xs text-slate-300">
                <p>Facturado: USD {totalInvoiced.toFixed(2)}</p>
                <p>Gastos: USD {totalExpenses.toFixed(2)}</p>
                <p className={margin >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  Margen: USD {margin.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
