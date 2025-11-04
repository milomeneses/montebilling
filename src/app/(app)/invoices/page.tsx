"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { buildInvoicePreviewImage, generateInvoicePdf, InvoicePdfPayload } from "@/lib/pdf";
import { Modal } from "@/components/modal";

function createEmptyLineItem() {
  return {
    id: crypto.randomUUID(),
    description: "",
    amount: 0,
  };
}

type LineItem = ReturnType<typeof createEmptyLineItem>;

type Message = { tone: "success" | "warning"; text: string } | null;

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

  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    return due.toISOString().slice(0, 10);
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem()]);
  const [taxes, setTaxes] = useState(0);
  const [notes, setNotes] = useState("");
  const [accentColor, setAccentColor] = useState("#10b981");
  const [headerText, setHeaderText] = useState("Factura Monte Animation");
  const [footerText, setFooterText] = useState("Gracias por confiar en Monte Animation.");
  const [logoDataUrl, setLogoDataUrl] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("Previsualización");
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (projects.length === 0) return;
    if (!projects.some((project) => project.id === projectId)) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projects, projectId],
  );
  const activeClient = useMemo(
    () => clients.find((client) => client.id === activeProject?.clientId),
    [clients, activeProject],
  );
  const currency = activeProject?.currency ?? "USD";

  const subtotal = useMemo(
    () =>
      lineItems.reduce((sum, item) => {
        const amount = Number(item.amount) || 0;
        return sum + amount;
      }, 0),
    [lineItems],
  );

  const total = subtotal + taxes;

  const outstandingSummary = useMemo(() => {
    const draft = invoices.filter((invoice) => invoice.status === "draft").length;
    const sent = invoices.filter((invoice) => invoice.status === "sent").length;
    const partial = invoices.filter((invoice) => invoice.status === "partial").length;
    const paid = invoices.filter((invoice) => invoice.status === "paid").length;
    return { draft, sent, partial, paid };
  }, [invoices]);

  const nextInvoiceNumber = useMemo(
    () => `MONTE-${String(nextInvoiceSequence).padStart(4, "0")}`,
    [nextInvoiceSequence],
  );

  const verificationBase =
    typeof window !== "undefined" ? window.location.origin : "https://billing.monteanimation.com";

  if (!user || user.role === "collaborator") {
    return (
      <section className="surface">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Facturación</h1>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Los colaboradores pueden revisar pagos asignados pero no emitir facturas. Solicita apoyo al administrador de Monte para enviar la factura correspondiente.
        </p>
      </section>
    );
  }

  const handleLineItemChange = (id: string, field: "description" | "amount", value: string) => {
    setLineItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "amount" ? Number(value) : value,
            }
          : item,
      ),
    );
  };

  const handleAddLineItem = () => {
    setLineItems((items) => [...items, createEmptyLineItem()]);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((items) => (items.length === 1 ? items : items.filter((item) => item.id !== id)));
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const buildPayload = (override?: {
    number?: string;
    issueDate?: string;
    dueDate?: string;
    subtotal?: number;
    taxes?: number;
    total?: number;
    notes?: string;
    lineItems?: { id: string; description: string; amount: number }[];
    branding?: {
      accentColor?: string;
      headerText?: string;
      footerText?: string;
      logoDataUrl?: string;
    };
    verificationUrl?: string;
  }): InvoicePdfPayload => {
    const invoiceNumber = override?.number ?? nextInvoiceNumber;
    const lineItemsList = override?.lineItems ?? lineItems;
    return {
      invoice: {
        number: invoiceNumber,
        issueDate: override?.issueDate ?? issueDate,
        dueDate: override?.dueDate ?? dueDate,
        subtotal: override?.subtotal ?? subtotal,
        taxes: override?.taxes ?? taxes,
        total: override?.total ?? total,
        currency,
        notes: override?.notes ?? notes,
        lineItems: lineItemsList,
        branding: {
          accentColor: override?.branding?.accentColor ?? accentColor,
          headerText: override?.branding?.headerText ?? headerText,
          footerText: override?.branding?.footerText ?? footerText,
          logoDataUrl: override?.branding?.logoDataUrl ?? logoDataUrl,
        },
        verificationUrl: override?.verificationUrl ?? `${verificationBase}/verify/${invoiceNumber}`,
      },
      projectName: activeProject?.name ?? "Proyecto Monte",
      clientName: activeClient?.name ?? "Cliente Monte",
      clientEmail: activeClient?.contactEmail,
      allocationsSummary: activeProject
        ? `Split configurado: ${activeProject.allocations.map((allocation) => `${allocation.name} ${allocation.percentage ?? 0}%`).join(" · ")}`
        : undefined,
    };
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const payload = buildPayload();
      setPreviewTitle(`Previsualización ${payload.invoice.number}`);
      const url = await buildInvoicePreviewImage(payload);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
      setMessage({ tone: "success", text: "Previsualización actualizada. Descarga el PDF cuando estés listo." });
    } catch (error) {
      console.error(error);
      setMessage({ tone: "warning", text: "No pudimos generar la previsualización. Reintenta en unos segundos." });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) return;
    const validItems = lineItems.filter((item) => item.description.trim().length > 0 && Number(item.amount) > 0);
    if (validItems.length === 0) {
      setMessage({ tone: "warning", text: "Agrega al menos un ítem con descripción y monto." });
      return;
    }
    const created = createInvoice({
      projectId,
      issueDate,
      dueDate,
      subtotal,
      taxes,
      total,
      currency: currency as "USD" | "ARS" | "COP",
      notes,
      lineItems: validItems,
      branding: {
        accentColor,
        headerText,
        footerText,
        logoDataUrl,
      },
    });
    setMessage({ tone: "success", text: `Factura ${created.number} creada. Puedes descargarla o enviarla al cliente.` });
    setPreviewUrl(undefined);
    setIsComposerOpen(false);
    setLineItems([createEmptyLineItem()]);
    setTaxes(0);
    setNotes("");
  };

  const handleDownload = async (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;
    const project = projects.find((item) => item.id === invoice.projectId);
    const client = clients.find((item) => item.id === project?.clientId);
    const payload = buildPayload({
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      taxes: invoice.taxes,
      total: invoice.total,
      notes: invoice.notes,
      lineItems: invoice.lineItems,
      branding: invoice.branding,
      verificationUrl: invoice.verificationUrl,
    });
    payload.projectName = project?.name ?? payload.projectName;
    payload.clientName = client?.name ?? payload.clientName;
    payload.clientEmail = client?.contactEmail ?? payload.clientEmail;
    const blob = await generateInvoicePdf(payload);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.number}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const handleExistingPreview = async (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;
    const project = projects.find((item) => item.id === invoice.projectId);
    const client = clients.find((item) => item.id === project?.clientId);
    const payload = buildPayload({
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      taxes: invoice.taxes,
      total: invoice.total,
      notes: invoice.notes,
      lineItems: invoice.lineItems,
      branding: invoice.branding,
      verificationUrl: invoice.verificationUrl,
    });
    payload.projectName = project?.name ?? payload.projectName;
    payload.clientName = client?.name ?? payload.clientName;
    payload.clientEmail = client?.contactEmail ?? payload.clientEmail;
    setPreviewTitle(`Factura ${invoice.number}`);
    const url = await buildInvoicePreviewImage(payload);
    setPreviewUrl(url);
    setIsPreviewOpen(true);
    setMessage({ tone: "success", text: `Previsualizando ${invoice.number}.` });
  };

  const handleCopyLink = async (verificationUrl: string) => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setMessage({ tone: "success", text: "Enlace de verificación copiado al portapapeles." });
    } catch (error) {
      console.error(error);
      setMessage({ tone: "warning", text: "No se pudo copiar el enlace. Copia manualmente desde la lista." });
    }
  };

  return (
    <div className="grid gap-8">
      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Facturación Monte</h1>
            <p className="text-sm text-[color:var(--text-secondary)] max-w-2xl">
              Genera facturas con numeración automática, personaliza la marca, añade un logo y distribuye un código QR que dirige al verificador oficial de Monte Animation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="tag">Próxima {nextInvoiceNumber}</span>
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:border-[color:var(--text-primary)]"
            >
              Nueva factura
            </button>
          </div>
        </div>
        <div className="surface-muted mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="Borradores" value={outstandingSummary.draft} />
          <Metric label="Enviadas" value={outstandingSummary.sent} />
          <Metric label="Parciales" value={outstandingSummary.partial} />
          <Metric label="Pagadas" value={outstandingSummary.paid} />
        </div>
      </section>

      {message && (
        <div
          className={`surface-strong ${
            message.tone === "success" ? "border-emerald-400/60" : "border-amber-400/60"
          } text-sm text-[color:var(--text-secondary)]`}
        >
          {message.text}
        </div>
      )}

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Facturas existentes</h2>
        <div className="mt-4 grid gap-4">
          {invoices.map((invoice) => {
            const project = projects.find((item) => item.id === invoice.projectId);
            const client = clients.find((item) => item.id === project?.clientId);
            return (
              <details
                key={invoice.id}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)]"
              >
                <summary
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5 text-left"
                  style={{ listStyle: "none" }}
                >
                  <div>
                    <h3 className="text-xl font-semibold text-[color:var(--text-primary)]">{invoice.number}</h3>
                    <p className="text-sm text-[color:var(--text-secondary)]">
                      {project?.name ?? invoice.projectId} · {client?.name ?? "Cliente sin nombre"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                    <span className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1 capitalize">
                      {invoice.status}
                    </span>
                    <span className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1">
                      {invoice.currency} {invoice.total.toLocaleString()}
                    </span>
                    <span className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1">
                      Vence {invoice.dueDate}
                    </span>
                  </div>
                </summary>
                <div className="grid gap-4 border-t border-[color:var(--border-subtle)] p-5">
                  {invoice.notes && (
                    <p className="text-sm text-[color:var(--text-secondary)]">{invoice.notes}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => updateInvoiceStatus(invoice.id, "sent")}
                      className="rounded-full border border-[color:var(--border-subtle)] px-3 py-2 font-semibold text-[color:var(--text-secondary)] transition hover:border-[color:var(--text-primary)]"
                    >
                      Marcar como enviada
                    </button>
                    <button
                      onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                      className="rounded-full border px-3 py-2 font-semibold text-xs transition"
                      style={{ borderColor: "var(--brand-accent)", color: "var(--brand-accent)" }}
                    >
                      Marcar como pagada
                    </button>
                    <button
                      onClick={() => updateInvoiceStatus(invoice.id, "void")}
                      className="rounded-full border border-rose-300 px-3 py-2 font-semibold text-rose-500"
                    >
                      Anular
                    </button>
                    <button
                      onClick={() => handleExistingPreview(invoice.id)}
                      className="rounded-full border px-3 py-2 font-semibold text-xs transition"
                      style={{ borderColor: "var(--brand-accent)", color: "var(--brand-accent)" }}
                    >
                      Previsualizar
                    </button>
                    <button
                      onClick={() => handleDownload(invoice.id)}
                      className="rounded-full border px-3 py-2 font-semibold text-xs transition"
                      style={{ borderColor: "var(--brand-accent)", color: "var(--brand-accent)" }}
                    >
                      Descargar PDF
                    </button>
                    <button
                      onClick={() => handleCopyLink(invoice.verificationUrl)}
                      className="rounded-full border border-dashed border-[color:var(--border-subtle)] px-3 py-2 font-semibold text-[color:var(--text-secondary)] transition hover:border-[color:var(--text-primary)]"
                    >
                      Copiar verificador
                    </button>
                  </div>
                  <div className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
                    <span>
                      QR verificador: {
                        <a
                          href={invoice.verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[color:var(--text-primary)] underline decoration-dotted underline-offset-4"
                        >
                          {invoice.verificationUrl}
                        </a>
                      }
                    </span>
                    <span>
                      Ítems: {invoice.lineItems.map((item) => `${item.description} (${invoice.currency} ${item.amount.toLocaleString()})`).join(" · ")}
                    </span>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </section>
      <Modal
        open={isComposerOpen}
        onClose={() => {
          setIsComposerOpen(false);
          setPreviewUrl(undefined);
        }}
        title="Nueva factura"
        description="Completa los datos del proyecto, personaliza la plantilla y genera el PDF con QR oficial."
        widthClassName="max-w-4xl"
      >
        <form onSubmit={handleCreate} className="mt-6 grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Proyecto
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Cliente
              <input
                value={activeClient?.name ?? "Selecciona un proyecto"}
                readOnly
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Emisión
              <input
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Vencimiento
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Moneda
              <input
                value={currency}
                readOnly
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
          </div>

          <details className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[color:var(--text-primary)]" style={{ listStyle: "none" }}>
              Ítems de factura
            </summary>
            <div className="mt-4 grid gap-3">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-white/80 p-4 md:grid-cols-[1fr,140px,auto] md:items-center"
                >
                  <input
                    value={item.description}
                    onChange={(event) => handleLineItemChange(item.id, "description", event.target.value)}
                    placeholder="Descripción"
                    className="rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--text-primary)]/40"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(event) => handleLineItemChange(item.id, "amount", event.target.value)}
                    className="rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--text-primary)]/40"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(item.id)}
                    className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50"
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddLineItem}
                className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)] hover:border-[color:var(--text-primary)]"
              >
                Añadir línea
              </button>
            </div>
          </details>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Impuestos adicionales
              <input
                type="number"
                value={taxes}
                onChange={(event) => setTaxes(Number(event.target.value))}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Notas internas
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
          </div>

          <details className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[color:var(--text-primary)]" style={{ listStyle: "none" }}>
              Personalización visual
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
                Color acento
                <input
                  type="color"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                  className="h-10 w-16 rounded-md border border-[color:var(--border-subtle)]"
                />
              </label>
              <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
                Encabezado
                <input
                  value={headerText}
                  onChange={(event) => setHeaderText(event.target.value)}
                  className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
                />
              </label>
              <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
                Pie de factura
                <input
                  value={footerText}
                  onChange={(event) => setFooterText(event.target.value)}
                  className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
                />
              </label>
              <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
                Logo (PNG o JPG)
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                  className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/80 px-4 py-3 text-sm text-[color:var(--text-secondary)]">
              Total estimado: <span className="font-semibold text-[color:var(--text-primary)]">{currency} {total.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={handlePreview}
              className="rounded-full border px-4 py-2 text-xs font-semibold text-[color:var(--text-primary)]"
              style={{ borderColor: "var(--brand-accent)", color: "var(--brand-accent)" }}
            >
              {isPreviewing ? "Generando…" : "Previsualizar"}
            </button>
            <button
              type="submit"
              className="rounded-full px-5 py-2 text-xs font-semibold text-white"
              style={{ background: "var(--brand-accent)" }}
            >
              Crear factura
            </button>
          </div>
        </form>
        {previewUrl ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-[color:var(--border-subtle)] bg-white">
            <Image
              src={previewUrl}
              alt="Previsualización de factura"
              width={1600}
              height={2260}
              className="h-auto w-full"
              unoptimized
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewUrl(undefined);
        }}
        title={previewTitle}
        widthClassName="max-w-3xl"
      >
        {previewUrl ? (
          <div className="overflow-hidden rounded-3xl border border-[color:var(--border-subtle)] bg-white">
            <Image
              src={previewUrl}
              alt={previewTitle}
              width={1600}
              height={2260}
              className="h-auto w-full"
              unoptimized
            />
          </div>
        ) : (
          <p className="text-sm text-[color:var(--text-secondary)]">Generando imagen de referencia…</p>
        )}
      </Modal>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: number;
};

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/80 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">{value}</p>
    </div>
  );
}
