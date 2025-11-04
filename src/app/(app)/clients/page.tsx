"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

export default function ClientsPage() {
  const { user } = useAuth();
  const { clients, addClient, updateClient, deleteClient, projects } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);

  const projectsByClient = useMemo(() => {
    return projects.reduce<Record<string, number>>((acc, project) => {
      acc[project.clientId] = (acc[project.clientId] ?? 0) + 1;
      return acc;
    }, {});
  }, [projects]);

  if (user?.role !== "owner") {
    return (
      <section className="surface">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Clientes</h1>
        <p className="text-sm text-[color:var(--text-secondary)] max-w-xl">
          Solo los owners pueden administrar el maestro de clientes. Si necesitas crear uno nuevo contacta a Milo o Sergio.
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
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateClient(id, {
      name: String(form.get("name")),
      contactEmail: String(form.get("contactEmail")),
      currency: String(form.get("currency")) as "USD" | "ARS" | "COP",
      notes: String(form.get("notes")),
    });
    setEditingId(null);
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
          <div className="tag">{clients.length} activos</div>
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
        <form onSubmit={handleCreate} className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Nuevo cliente</h2>
            <p className="text-xs text-[color:var(--text-secondary)]">Todos los campos son obligatorios salvo notas.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Nombre
              <input
                name="name"
                required
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)] outline-none focus:border-emerald-400"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Email contacto
              <input
                name="contactEmail"
                type="email"
                required
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)] outline-none focus:border-emerald-400"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Moneda base
              <select
                name="currency"
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)] outline-none focus:border-emerald-400"
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
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)] outline-none focus:border-emerald-400"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 md:w-auto"
          >
            Crear cliente
          </button>
        </form>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Maestro de clientes</h2>
        <div className="mt-4 grid gap-4">
          {clients.map((client) => (
            <article
              key={client.id}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5"
            >
              {editingId === client.id ? (
                <form
                  className="grid gap-4 md:grid-cols-2"
                  onSubmit={(event) => handleUpdate(event, client.id)}
                >
                  <label className="grid gap-1 text-sm text-[color:var(--text-secondary)]">
                    Nombre
                    <input
                      name="name"
                      defaultValue={client.name}
                      className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-2 text-sm text-[color:var(--text-primary)]"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-[color:var(--text-secondary)]">
                    Email
                    <input
                      name="contactEmail"
                      type="email"
                      defaultValue={client.contactEmail}
                      className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-2 text-sm text-[color:var(--text-primary)]"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-[color:var(--text-secondary)]">
                    Moneda
                    <select
                      name="currency"
                      defaultValue={client.currency}
                      className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-2 text-sm text-[color:var(--text-primary)]"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                      <option value="COP">COP</option>
                    </select>
                  </label>
                  <label className="md:col-span-2 grid gap-1 text-sm text-[color:var(--text-secondary)]">
                    Notas
                    <textarea
                      name="notes"
                      defaultValue={client.notes}
                      className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-2 text-sm text-[color:var(--text-primary)]"
                    />
                  </label>
                  <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)] hover:border-rose-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-950 hover:bg-emerald-400"
                    >
                      Guardar cambios
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="grid gap-1">
                    <h3 className="text-base font-semibold text-[color:var(--text-primary)]">{client.name}</h3>
                    <p className="text-xs text-[color:var(--text-secondary)]">{client.contactEmail}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                    <span className="tag">{client.currency}</span>
                    <span className="tag">{projectsByClient[client.id] ?? 0} proyectos</span>
                    <button
                      onClick={() => setEditingId(client.id)}
                      className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 font-semibold text-[color:var(--text-secondary)] transition hover:border-emerald-400"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="rounded-full border border-rose-400/60 px-4 py-2 font-semibold text-rose-500 transition hover:bg-rose-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
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
