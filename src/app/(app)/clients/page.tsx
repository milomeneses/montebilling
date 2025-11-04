"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { Modal } from "@/components/modal";

export default function ClientsPage() {
  const { user } = useAuth();
  const { clients, addClient, updateClient, deleteClient, projects } = useData();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<(typeof clients)[number] | null>(null);

  const projectsByClient = useMemo(() => {
    return projects.reduce<Record<string, number>>((acc, project) => {
      acc[project.clientId] = (acc[project.clientId] ?? 0) + 1;
      return acc;
    }, {});
  }, [projects]);

  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return (
      <section className="surface">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Clientes</h1>
        <p className="text-sm text-[color:var(--text-secondary)] max-w-xl">
          Solo los owners o administradores pueden administrar el maestro de clientes. Solicita apoyo a Milo, Sergio o al admin
          para dar de alta un nuevo cliente.
        </p>
      </section>
    );
  }

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const contactEmail = String(form.get("contactEmail"));
    const currency = String(form.get("currency")) as "USD" | "ARS" | "COP";
    const notes = String(form.get("notes"));
    addClient({ name, contactEmail, currency, notes });
    event.currentTarget.reset();
    setIsCreateOpen(false);
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    if (!editingClient) return;
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateClient(editingClient.id, {
      name: String(form.get("name")),
      contactEmail: String(form.get("contactEmail")),
      currency: String(form.get("currency")) as "USD" | "ARS" | "COP",
      notes: String(form.get("notes")),
    });
    setEditingClient(null);
  };

  return (
    <div className="grid gap-8">
      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Clientes Monte</h1>
            <p className="max-w-2xl text-sm text-[color:var(--text-secondary)]">
              Registra la información de contacto y moneda preferida de tus clientes para enlazarla con proyectos, facturas y reportes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="tag">{clients.length} activos</span>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:border-[color:var(--text-primary)]"
            >
              Nuevo cliente
            </button>
          </div>
        </div>
        <dl className="surface-muted mt-6 grid gap-3 md:grid-cols-3">
          <SummaryItem label="Clientes con proyectos" value={Object.keys(projectsByClient).length} />
          <SummaryItem
            label="Proyectos totales"
            value={projects.length}
          />
          <SummaryItem
            label="Monedas operadas"
            value={new Set(clients.map((client) => client.currency)).size}
          />
        </dl>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Agenda centralizada</h2>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Utiliza el panel de clientes para acceder rápidamente a contactos, notas y moneda base. Desde aquí también puedes lanzar el flujo de proyectos o facturación.
        </p>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Maestro de clientes</h2>
        <div className="mt-4 grid gap-4">
          {clients.map((client) => {
            const projectCount = projectsByClient[client.id] ?? 0;
            return (
              <details
                key={client.id}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)]"
              >
                <summary
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5 text-left"
                  style={{ listStyle: "none" }}
                >
                  <div>
                    <h3 className="text-xl font-semibold text-[color:var(--text-primary)]">{client.name}</h3>
                    <p className="text-sm text-[color:var(--text-secondary)]">{client.contactEmail}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                    <span className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1">{client.currency}</span>
                    <span className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1">{projectCount} proyectos</span>
                  </div>
                </summary>
                <div className="grid gap-3 border-t border-[color:var(--border-subtle)] p-5 text-sm">
                    <p className="text-[color:var(--text-secondary)]">{client.notes?.length ? client.notes : "Sin notas internas"}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingClient(client)}
                      className="rounded-full border border-[color:var(--border-subtle)] px-3 py-2 font-semibold text-[color:var(--text-secondary)] transition hover:border-[color:var(--text-primary)]"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteClient(client.id)}
                      className="rounded-full border border-rose-200 px-3 py-2 font-semibold text-rose-500 hover:bg-rose-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo cliente"
        description="Completa los datos básicos y enlázalos con proyectos futuros."
      >
        <form onSubmit={handleCreate} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Nombre
            <input
              name="name"
              required
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Email contacto
            <input
              name="contactEmail"
              type="email"
              required
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Moneda base
            <select
              name="currency"
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="COP">COP</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)] md:col-span-2">
            Notas internas
            <textarea
              name="notes"
              rows={2}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded-full px-5 py-2 text-xs font-semibold text-white"
              style={{ background: "var(--brand-accent)" }}
            >
              Guardar cliente
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingClient)}
        onClose={() => setEditingClient(null)}
        title={editingClient ? `Editar ${editingClient.name}` : "Editar cliente"}
      >
        {editingClient ? (
          <form onSubmit={handleUpdate} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Nombre
              <input
                name="name"
                defaultValue={editingClient.name}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Email contacto
              <input
                name="contactEmail"
                type="email"
                defaultValue={editingClient.contactEmail}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Moneda base
              <select
                name="currency"
                defaultValue={editingClient.currency}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="COP">COP</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)] md:col-span-2">
              Notas internas
              <textarea
                name="notes"
                defaultValue={editingClient.notes}
                rows={2}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-full px-5 py-2 text-xs font-semibold text-white"
                style={{ background: "var(--brand-accent)" }}
              >
                Actualizar
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-4 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[color:var(--text-primary)]">{value}</p>
    </div>
  );
}
