"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

function buildInvoicePreview(invoice: {
  number: string;
  projectName: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;
  notes?: string;
}) {
  return `<!doctype html><html><head><title>${invoice.number}</title><style>
    body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; }
    h1 { font-size: 28px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    td, th { border: 1px solid #cbd5f5; padding: 12px; text-align: left; }
    .totals { margin-top: 32px; }
    .totals div { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .notes { margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 12px; }
  </style></head><body>
    <h1>Factura ${invoice.number}</h1>
    <p><strong>Proyecto:</strong> ${invoice.projectName}</p>
    <p><strong>Cliente:</strong> ${invoice.clientName}</p>
    <p><strong>Emisión:</strong> ${invoice.issueDate} · <strong>Vencimiento:</strong> ${invoice.dueDate}</p>
    <table>
      <thead><tr><th>Descripción</th><th>Monto</th></tr></thead>
      <tbody>
        <tr><td>Subtotal</td><td>${invoice.currency} ${invoice.subtotal.toLocaleString()}</td></tr>
        <tr><td>Impuestos</td><td>${invoice.currency} ${invoice.taxes.toLocaleString()}</td></tr>
        <tr><td>Total</td><td>${invoice.currency} ${invoice.total.toLocaleString()}</td></tr>
      </tbody>
    </table>
    <div class="totals">
      <div><span>Total a pagar</span><strong>${invoice.currency} ${invoice.total.toLocaleString()}</strong></div>
    </div>
    <div class="notes"><strong>Notas:</strong><p>${invoice.notes ?? ""}</p></div>
  </body></html>`;
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const {
    invoices,
    projects,
    clients,
    createInvoice,
    updateInvoiceStatus,
    nextInvoiceSequence,
  } = useData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id ?? "",
  );

  const activeProjectId = useMemo(() => {
    if (selectedProjectId && projects.some((project) => project.id === selectedProjectId)) {
      return selectedProjectId;
    }
    return projects[0]?.id ?? "";
  }, [projects, selectedProjectId]);

  const nextInvoiceNumber = useMemo(() => {
    return `MONTE-${String(nextInvoiceSequence).padStart(4, "0")}`;
  }, [nextInvoiceSequence]);

  const defaultIssueDate = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );

  const defaultDueDate = useMemo(() => {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    return due.toISOString().slice(0, 10);
  }, []);

  if (user?.role !== "owner") {
    return (
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold">Facturación</h1>
        <p className="text-sm text-slate-300">
          Los colaboradores no tienen acceso al módulo de invoices. Solicita a un owner que genere y envíe la factura correspondiente.
        </p>
      </section>
    );
  }

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projectId = String(form.get("projectId")) || activeProjectId;
    if (!projectId) return;
    const issueDate = String(form.get("issueDate"));
    const dueDate = String(form.get("dueDate"));
    const currency = String(form.get("currency")) as "USD" | "ARS" | "COP";
    const subtotal = Number(form.get("subtotal"));
    const taxes = Number(form.get("taxes"));
    const total = subtotal + taxes;
    const notes = String(form.get("notes"));
    createInvoice({
      projectId,
      issueDate,
      dueDate,
      subtotal,
      taxes,
      total,
      currency,
      notes,
    });
    event.currentTarget.reset();
    setSelectedProjectId(projectId);
  };

  const handlePreview = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;
    const project = projects.find((item) => item.id === invoice.projectId);
    const client = clients.find((item) => item.id === project?.clientId);
    const content = buildInvoicePreview({
      number: invoice.number,
      projectName: project?.name ?? invoice.projectId,
      clientName: client?.name ?? project?.clientId ?? "Cliente",
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      taxes: invoice.taxes,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes,
    });
    const pdfWindow = window.open("", "_blank");
    if (!pdfWindow) return;
    pdfWindow.document.write(content);
    pdfWindow.document.close();
    pdfWindow.focus();
  };

  const handleSendEmail = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;
    const project = projects.find((item) => item.id === invoice.projectId);
    const client = clients.find((item) => item.id === project?.clientId);
    alert(
      `Enviada factura ${invoice.number} a ${client?.contactEmail ?? "cliente"}. (Simulación de envío por Resend/SMTP)`,
    );
  };

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Invoices</h1>
            <p className="text-sm text-slate-300">
              Numeración automática, plantilla PDF y envío por email integrados.
            </p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
            Próxima: {nextInvoiceNumber}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-300">
            Necesitas crear al menos un proyecto antes de emitir una invoice.
          </div>
        ) : (
          <form onSubmit={handleCreate} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-xs text-slate-400">
              Proyecto
              <select
                name="projectId"
                value={activeProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              Moneda
              <select
                key={activeProjectId || "currency-select"}
                name="currency"
                defaultValue={projects.find((item) => item.id === activeProjectId)?.currency ?? "USD"}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="COP">COP</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              Número sugerido
              <input
                value={nextInvoiceNumber}
                readOnly
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-500"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-xs text-slate-400">
              Fecha emisión
              <input
                name="issueDate"
                type="date"
                defaultValue={defaultIssueDate}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              Fecha vencimiento
              <input
                name="dueDate"
                type="date"
                defaultValue={defaultDueDate}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              Subtotal
              <input
                name="subtotal"
                type="number"
                required
                step="0.01"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-xs text-slate-400">
              Impuestos
              <input
                name="taxes"
                type="number"
                step="0.01"
                defaultValue={0}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="md:col-span-2 grid gap-1 text-xs text-slate-400">
              Notas
              <textarea
                name="notes"
                rows={2}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Generar invoice
          </button>
        </form>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Historial</h2>
        <div className="grid gap-4">
          {invoices.map((invoice) => {
            const project = projects.find((item) => item.id === invoice.projectId);
            const client = clients.find((item) => item.id === project?.clientId);
            return (
              <article
                key={invoice.id}
                className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{invoice.number}</h3>
                    <p className="text-xs text-slate-400">
                      {project?.name ?? invoice.projectId} · {client?.name ?? project?.clientId ?? "Cliente"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700 px-3 py-1">{invoice.status}</span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      {invoice.currency} {invoice.total.toLocaleString()}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      Emisión {invoice.issueDate}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      Vence {invoice.dueDate}
                    </span>
                  </div>
                </div>
                {invoice.notes && <p className="text-sm text-slate-300">{invoice.notes}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => updateInvoiceStatus(invoice.id, "sent")}
                    className="rounded-full border border-slate-700 px-3 py-1 text-slate-300 hover:border-emerald-400"
                  >
                    Marcar como enviada
                  </button>
                  <button
                    onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                    className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-emerald-200"
                  >
                    Marcar como pagada
                  </button>
                  <button
                    onClick={() => updateInvoiceStatus(invoice.id, "void")}
                    className="rounded-full border border-rose-600/60 px-3 py-1 text-rose-300"
                  >
                    Anular
                  </button>
                  <button
                    onClick={() => handlePreview(invoice.id)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-slate-300 hover:border-emerald-400"
                  >
                    Generar PDF
                  </button>
                  <button
                    onClick={() => handleSendEmail(invoice.id)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-slate-300 hover:border-emerald-400"
                  >
                    Enviar por email
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
