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
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-slate-300">
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
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {clients.length} activos
          </span>
        </div>
        <form onSubmit={handleCreate} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-2">
          <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Nombre
            <input
              name="name"
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
            />
          </label>
          <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Email contacto
            <input
              name="contactEmail"
              type="email"
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
            />
          </label>
          <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Moneda base
            <select
              name="currency"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="COP">COP</option>
            </select>
          </label>
          <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-slate-400 md:col-span-2">
            Notas
            <textarea
              name="notes"
              rows={2}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
            />
          </label>
          <button
            type="submit"
            className="md:col-span-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Crear cliente
          </button>
        </form>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Maestro de clientes</h2>
        <div className="grid gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
            >
              {editingId === client.id ? (
                <form
                  className="grid gap-3 md:grid-cols-2"
                  onSubmit={(event) => handleUpdate(event, client.id)}
                >
                  <label className="grid gap-1 text-xs text-slate-400">
                    Nombre
                    <input
                      name="name"
                      defaultValue={client.name}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-slate-400">
                    Email
                    <input
                      name="contactEmail"
                      type="email"
                      defaultValue={client.contactEmail}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-slate-400">
                    Moneda
                    <select
                      name="currency"
                      defaultValue={client.currency}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                      <option value="COP">COP</option>
                    </select>
                  </label>
                  <label className="md:col-span-2 grid gap-1 text-xs text-slate-400">
                    Notas
                    <textarea
                      name="notes"
                      defaultValue={client.notes}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                  <div className="md:col-span-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-950"
                    >
                      Guardar cambios
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{client.name}</h3>
                    <p className="text-xs text-slate-400">{client.contactEmail}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700 px-3 py-1">{client.currency}</span>
                    <span className="rounded-full border border-slate-700 px-3 py-1">
                      {projectsByClient[client.id] ?? 0} proyectos
                    </span>
                    <button
                      onClick={() => setEditingId(client.id)}
                      className="rounded-full border border-slate-700 px-3 py-1 transition hover:border-emerald-400"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="rounded-full border border-rose-600/70 px-3 py-1 text-rose-300 transition hover:bg-rose-600/10"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
