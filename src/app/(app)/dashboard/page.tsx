"use client";

import { useMemo } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

function convertToUsd(amount: number, currency: string, rates: ReturnType<typeof useData>["exchangeRates"]) {
  if (currency === "USD") return amount;
  const match = [...rates]
    .filter((rate) => rate.fromCurrency === currency && rate.toCurrency === "USD")
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return amount * (match?.rate ?? 1);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { invoices, payments, expenses, balances, projects, clients, exchangeRates } = useData();

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
      .reduce((acc, expense) => acc + convertToUsd(expense.amount, expense.currency, exchangeRates), 0);

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
      return { project, totalInvoiced, totalExpenses, margin };
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

  const totals = useMemo(() => {
    return {
      clients: clients.length,
      projects: projects.length,
      invoices: invoices.length,
      pagos: payments.length,
      gastos: expenses.length,
    };
  }, [clients.length, projects.length, invoices.length, payments.length, expenses.length]);

  const invoiceMatrix = useMemo(() => {
    return invoices.map((invoice) => {
      const project = projects.find((item) => item.id === invoice.projectId);
      const client = clients.find((item) => item.id === project?.clientId);
      const paid = payments
        .filter((payment) => payment.invoiceId === invoice.id)
        .reduce((sum, payment) => sum + payment.amount, 0);
      const pending = Math.max(invoice.total - paid, 0);
      return {
        id: invoice.id,
        number: invoice.number,
        client: client?.name ?? "Cliente sin nombre",
        brand: project?.brand ?? "—",
        project: project?.name ?? invoice.projectId,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        total: `${invoice.currency} ${invoice.total.toLocaleString()}`,
        pending: `${invoice.currency} ${pending.toLocaleString()}`,
      };
    });
  }, [clients, invoices, payments, projects]);

  return (
    <div className="grid gap-8">
      <section className="surface">
        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Dashboard financiero</h1>
          <p className="text-sm text-[color:var(--text-secondary)] max-w-2xl">
            Controla facturación, cobros, gastos y márgenes con la misma velocidad del Excel pero con visibilidad multiusuario y reglas automatizadas.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Metric label="Facturado este mes" value={`USD ${metrics.invoicedThisMonth.toFixed(2)}`} />
          <Metric label="Total por cobrar" value={`USD ${metrics.outstanding.toFixed(2)}`} />
          <Metric label="Gastos del mes" value={`USD ${metrics.expensesMonth.toFixed(2)}`} />
          <Metric label={`Balance ${user?.name ?? "Personal"}`} value={`USD ${personalBalance.toFixed(2)}`} />
        </div>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Resumen general</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <CountPill label="Clientes" value={totals.clients} />
          <CountPill label="Proyectos" value={totals.projects} />
          <CountPill label="Invoices" value={totals.invoices} />
          <CountPill label="Pagos" value={totals.pagos} />
          <CountPill label="Gastos" value={totals.gastos} />
        </div>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Vista consolidada tipo Excel</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Recorre rápidamente facturas, proyectos y clientes en columnas compactas. Puedes copiar y pegar esta tabla directamente a un sheet si lo necesitas.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm text-[color:var(--text-secondary)]">
            <thead>
              <tr className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
                <th className="rounded-l-2xl bg-[color:var(--surface-muted)] px-4 py-3 font-semibold">Factura</th>
                <th className="bg-[color:var(--surface-muted)] px-4 py-3 font-semibold">Cliente</th>
                <th className="bg-[color:var(--surface-muted)] px-4 py-3 font-semibold">Marca</th>
                <th className="bg-[color:var(--surface-muted)] px-4 py-3 font-semibold">Proyecto</th>
                <th className="bg-[color:var(--surface-muted)] px-4 py-3 font-semibold">Estado</th>
                <th className="bg-[color:var(--surface-muted)] px-4 py-3 font-semibold">Emitida</th>
                <th className="bg-[color:var(--surface-muted)] px-4 py-3 font-semibold">Vence</th>
                <th className="bg-[color:var(--surface-muted)] px-4 py-3 font-semibold">Total</th>
                <th className="rounded-r-2xl bg-[color:var(--surface-muted)] px-4 py-3 font-semibold">Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {invoiceMatrix.map((row) => (
                <tr key={row.id} className="rounded-2xl bg-white/80 text-[color:var(--text-primary)] shadow-sm">
                  <td className="rounded-l-2xl px-4 py-3 font-mono text-xs">{row.number}</td>
                  <td className="px-4 py-3">{row.client}</td>
                  <td className="px-4 py-3">{row.brand}</td>
                  <td className="px-4 py-3">{row.project}</td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                  <td className="px-4 py-3">{row.issueDate}</td>
                  <td className="px-4 py-3">{row.dueDate}</td>
                  <td className="px-4 py-3">{row.total}</td>
                  <td className="rounded-r-2xl px-4 py-3">{row.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Invoices vencidas</h2>
          <span className="tag">{metrics.overdueInvoices.length} pendientes</span>
        </div>
        <div className="mt-4 grid gap-3">
          {metrics.overdueInvoices.length === 0 && (
            <p className="text-sm text-[color:var(--text-secondary)]">No hay facturas vencidas. ¡Excelente!</p>
          )}
          {metrics.overdueInvoices.map((invoice) => {
            const pending = invoice.total - payments
              .filter((payment) => payment.invoiceId === invoice.id)
              .reduce((sum, payment) => sum + payment.amount, 0);
            return (
              <article
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">{invoice.number}</p>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    Vencía el {new Date(invoice.dueDate).toLocaleDateString()} · Estado {invoice.status}
                  </p>
                </div>
                <div className="text-right text-xs text-[color:var(--text-secondary)]">
                  <p>Total: {invoice.currency} {invoice.total.toLocaleString()}</p>
                  <p>Pendiente: {invoice.currency} {pending.toLocaleString()}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Margen por proyecto</h2>
        <div className="mt-4 grid gap-3">
          {metrics.marginByProject.map(({ project, totalInvoiced, totalExpenses, margin }) => {
            const client = clients.find((client) => client.id === project.clientId);
            return (
              <article
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">{project.name}</p>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    Cliente: {client?.name ?? project.clientId} · Estado {project.status.toUpperCase()}
                  </p>
                </div>
                <div className="text-right text-xs text-[color:var(--text-secondary)]">
                  <p>Facturado: USD {totalInvoiced.toFixed(2)}</p>
                  <p>Gastos: USD {totalExpenses.toFixed(2)}</p>
                  <p className={margin >= 0 ? "text-emerald-600" : "text-rose-600"}>Margen: USD {margin.toFixed(2)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/80 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--text-primary)]">{value}</p>
    </div>
  );
}

type CountPillProps = {
  label: string;
  value: number;
};

function CountPill({ label, value }: CountPillProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">{value}</p>
    </div>
  );
}
