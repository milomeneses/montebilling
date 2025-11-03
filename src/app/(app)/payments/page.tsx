"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

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
    if (user?.role === "owner") return payments;
    if (!user) return [];
    return payments.filter((payment) =>
      payment.splits.some((split) =>
        split.name.toLowerCase().includes((user.name ?? "").toLowerCase()),
      ),
    );
  }, [payments, user]);

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
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Pagos</h1>
            <p className="text-sm text-slate-300">
              Registra cobros para aplicar caja chica y split automático entre Milo, Sergio y colaboradores.
            </p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
            {visiblePayments.length} registros
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-300">
            No hay invoices disponibles para registrar pagos. Crea una factura primero.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-xs text-slate-400">
              Invoice
              <select
                value={activeInvoiceId}
                onChange={(event) => setSelectedInvoiceId(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.number} · {invoice.currency} {invoice.total.toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              Fecha del pago
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
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
                key={selectedInvoice?.id ?? activeInvoiceId ?? "currency-select"}
                name="currency"
                defaultValue={selectedInvoice?.currency ?? "USD"}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="COP">COP</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              Método
              <input
                name="method"
                defaultValue="transfer"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          </div>

          <label className="grid gap-1 text-xs text-slate-400">
            Tipo de cambio a USD (opcional)
            <input
              name="exchangeRate"
              type="number"
              step="0.0001"
              placeholder="1"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Registrar pago
          </button>
        </form>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Ledger de pagos</h2>
        <div className="grid gap-4">
          {visiblePayments.map((payment) => {
            const invoice = invoices.find((item) => item.id === payment.invoiceId);
            const project = projects.find((item) => item.id === payment.projectId);
            return (
              <article
                key={payment.id}
                className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {invoice?.number ?? payment.invoiceId}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {project?.name ?? payment.projectId} · {payment.method}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      Caja chica: {payment.pettyContribution.toFixed(2)} {payment.currency}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      {payment.date}
                    </span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Split</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                    {payment.splits.map((split) => (
                      <span
                        key={split.allocationId}
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1"
                      >
                        {split.name}: {payment.currency} {split.amount.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
