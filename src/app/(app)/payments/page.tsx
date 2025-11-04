"use client";

import { FormEvent, useMemo, useState } from "react";

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

export default function PaymentsPage() {
  const { user } = useAuth();
  const { invoices, payments, projects, recordPayment } = useData();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    invoices[0]?.id ?? "",
  );

  const activeInvoiceId = useMemo(() => {
    if (selectedInvoiceId && invoices.some((invoice) => invoice.id === selectedInvoiceId)) {
      return selectedInvoiceId;
    }
    return invoices[0]?.id ?? "";
  }, [invoices, selectedInvoiceId]);

  const selectedInvoice = useMemo(
    () => invoices.find((item) => item.id === activeInvoiceId),
    [invoices, activeInvoiceId],
  );

  const visiblePayments = useMemo(() => {
    if (user && user.role !== "collaborator") return payments;
    if (!user) return [];
    return payments.filter((payment) =>
      payment.splits.some((split) =>
        split.name.toLowerCase().includes((user.name ?? "").toLowerCase()),
      ),
    );
  }, [payments, user]);

  const paymentSummary = useMemo(() => {
    if (visiblePayments.length === 0) {
      return {
        totalsLabel: "Sin registros",
        pettyLabel: "Sin aportes",
        lastDate: "-",
      };
    }
    const totals = visiblePayments.reduce<Record<string, number>>((acc, payment) => {
      acc[payment.currency] = (acc[payment.currency] ?? 0) + payment.amount;
      return acc;
    }, {});
    const pettyTotals = visiblePayments.reduce<Record<string, number>>((acc, payment) => {
      acc[payment.currency] = (acc[payment.currency] ?? 0) + payment.pettyContribution;
      return acc;
    }, {});
    const totalsLabel = Object.entries(totals)
      .map(([currency, value]) => `${currency} ${value.toLocaleString()}`)
      .join(" · ");
    const pettyLabel = Object.entries(pettyTotals)
      .map(([currency, value]) => `${currency} ${value.toLocaleString()}`)
      .join(" · ") || "Sin aportes";
    const lastDate = visiblePayments
      .map((payment) => payment.date)
      .sort((a, b) => (a < b ? 1 : -1))[0];
    return {
      totalsLabel,
      pettyLabel,
      lastDate,
    };
  }, [visiblePayments]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invoice = selectedInvoice;
    if (!invoice) return;
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));
    const method = String(form.get("method"));
    const date = String(form.get("date"));
    const currency = String(form.get("currency")) as "USD" | "ARS" | "COP";
    const exchangeRate = Number(form.get("exchangeRate")) || undefined;
    recordPayment({
      invoiceId: invoice.id,
      projectId: invoice.projectId,
      amount,
      currency,
      method,
      date,
      exchangeRate,
      createdBy: user?.name ?? "Owner",
      appliedTo: invoice.number,
    });
    event.currentTarget.reset();
  };

  return (
    <div className="grid gap-8">
      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Pagos</h1>
            <p className="text-sm text-[color:var(--text-secondary)] max-w-2xl">
              Registra cobros para aplicar caja chica y split automático entre Milo, Sergio y colaboradores.
            </p>
          </div>
          <div className="tag">{visiblePayments.length} registros</div>
        </div>
        <div className="surface-muted mt-6 grid gap-3 md:grid-cols-3">
          <SummaryCard label="Total cobrado" value={paymentSummary.totalsLabel} />
          <SummaryCard label="Caja chica acumulada" value={paymentSummary.pettyLabel} />
          <SummaryCard label="Último pago" value={paymentSummary.lastDate} />
        </div>
      </section>

      <section className="surface">
        {invoices.length === 0 ? (
          <div className="surface-strong text-sm text-[color:var(--text-secondary)]">
            No hay invoices disponibles para registrar pagos. Crea una factura primero.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Registrar nuevo pago</h2>
              <p className="text-xs text-[color:var(--text-secondary)]">
                Selecciona la factura y completa el detalle del cobro.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Invoice
                <select
                  value={activeInvoiceId}
                  onChange={(event) => setSelectedInvoiceId(event.target.value)}
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                >
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.number} · {invoice.currency} {invoice.total.toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Fecha del pago
                <input
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
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
                  required
                  step="0.01"
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Moneda
                <select
                  key={selectedInvoice?.id ?? activeInvoiceId ?? "currency-select"}
                  name="currency"
                  defaultValue={selectedInvoice?.currency ?? "USD"}
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                  <option value="COP">COP</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Método
                <input
                  name="method"
                  defaultValue="transfer"
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Tipo de cambio a USD (opcional)
              <input
                name="exchangeRate"
                type="number"
                step="0.0001"
                placeholder="1"
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>

            <button
              type="submit"
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Registrar pago
            </button>
          </form>
        )}
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Ledger de pagos</h2>
        <div className="mt-4 grid gap-4">
          {visiblePayments.map((payment) => {
            const invoice = invoices.find((item) => item.id === payment.invoiceId);
            const project = projects.find((item) => item.id === payment.projectId);
            return (
              <article
                key={payment.id}
                className="grid gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid gap-1">
                    <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
                      {invoice?.number ?? payment.invoiceId}
                    </h3>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      {project?.name ?? payment.projectId} · {payment.method}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                    <span className="tag">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </span>
                    <span className="tag">
                      Caja chica: {payment.pettyContribution.toFixed(2)} {payment.currency}
                    </span>
                    <span className="tag">{payment.date}</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Split</p>
                  <div className="flex flex-wrap gap-2 text-xs text-[color:var(--text-secondary)]">
                    {payment.splits.map((split) => (
                      <span
                        key={split.allocationId}
                        className="rounded-full border border-emerald-400/60 bg-emerald-50 px-3 py-1 text-emerald-600"
                      >
                        {split.name} · {split.amount.toLocaleString()} {payment.currency}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
          {visiblePayments.length === 0 && (
            <div className="surface-strong text-sm text-[color:var(--text-secondary)]">
              Aún no registraste pagos en los que participes.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
