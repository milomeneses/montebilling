"use client";

import Link from "next/link";

import { DataProvider, useData } from "@/context/data-context";
import { ThemeProvider } from "@/context/theme-context";

function InvoiceVerifier({ invoiceId }: { invoiceId: string }) {
  const { invoices, projects, clients } = useData();
  const invoice = invoices.find((item) => item.id === invoiceId || item.number === invoiceId);

  if (!invoice) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Factura no encontrada</h1>
        <p className="text-sm text-[color:var(--text-secondary)]">
          No encontramos una factura con ese identificador en los registros locales. Verifica el código QR o comunícate con Monte Animation.
        </p>
        <Link href="/" className="rounded-full border border-[color:var(--border-subtle)] px-5 py-2 text-sm text-[color:var(--text-secondary)] hover:border-emerald-500">
          Volver al inicio
        </Link>
      </main>
    );
  }

  const project = projects.find((item) => item.id === invoice.projectId);
  const client = clients.find((item) => item.id === project?.clientId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="tag">Monte Animation</span>
            <h1 className="mt-4 text-3xl font-semibold text-[color:var(--text-primary)]">Factura {invoice.number}</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">
              Verificación oficial. Esta factura fue emitida por Monte Animation y forma parte del histórico del estudio.
            </p>
          </div>
          <Link href="/" className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs text-[color:var(--text-secondary)] hover:border-emerald-500">
            Ir a la app
          </Link>
        </div>
      </div>

      <div className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Detalles principales</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Info label="Proyecto" value={project?.name ?? invoice.projectId} />
          <Info label="Cliente" value={client?.name ?? "Cliente no identificado"} />
          <Info label="Fecha de emisión" value={invoice.issueDate} />
          <Info label="Fecha de vencimiento" value={invoice.dueDate} />
          <Info label="Estado" value={invoice.status.toUpperCase()} />
          <Info label="Total" value={`${invoice.currency} ${invoice.total.toLocaleString()}`} />
        </div>
      </div>

      <div className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Conceptos facturados</h2>
        <div className="mt-4 grid gap-2">
          {invoice.lineItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            >
              <span>{item.description}</span>
              <span>{invoice.currency} {item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
        {invoice.notes && (
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">Notas: {invoice.notes}</p>
        )}
      </div>

      <div className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Verificación QR</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Escaneaste un código generado automáticamente en Monte Billing. Este enlace confirma que el QR fue emitido por Monte Animation y muestra el monto original de la factura.
        </p>
        <Link
          href={`/invoices`}
          className="mt-4 inline-flex items-center rounded-full border border-[color:var(--border-subtle)] px-5 py-2 text-xs font-semibold text-[color:var(--text-secondary)] hover:border-emerald-500"
        >
          Abrir módulo de invoices
        </Link>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--text-primary)]">{value}</p>
    </div>
  );
}

export default function VerifyPage({ params }: { params: { invoiceId: string } }) {
  return (
    <ThemeProvider>
      <DataProvider>
        <InvoiceVerifier invoiceId={decodeURIComponent(params.invoiceId)} />
      </DataProvider>
    </ThemeProvider>
  );
}
