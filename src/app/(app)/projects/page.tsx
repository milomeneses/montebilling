"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

type AllocationForm = {
  id: string;
  name: string;
  role: "milo" | "sergio" | "collaborator";
  percentage?: number;
  fixedAmount?: number;
};

const defaultAllocations: AllocationForm[] = [
  { id: crypto.randomUUID(), name: "Milo", role: "milo", percentage: 40 },
  { id: crypto.randomUUID(), name: "Sergio", role: "sergio", percentage: 40 },
  { id: crypto.randomUUID(), name: "Colaboradores", role: "collaborator", percentage: 20 },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const { projects, clients, addProject } = useData();
  const [allocations, setAllocations] = useState<AllocationForm[]>(defaultAllocations);

  const visibleProjects = useMemo(() => {
    if (user?.role === "owner") return projects;
    if (!user) return [];
    return projects.filter((project) =>
      project.allocations.some((allocation) =>
        allocation.name.toLowerCase().includes((user.name ?? "").toLowerCase()),
      ),
    );
  }, [projects, user]);

  const budgetSummary = useMemo(() => {
    const totals = visibleProjects.reduce<Record<string, number>>((acc, project) => {
      acc[project.currency] = (acc[project.currency] ?? 0) + project.budget;
      return acc;
    }, {});
    return Object.entries(totals)
      .map(([currency, value]) => `${currency} ${value.toLocaleString()}`)
      .join(" · ") || "Sin datos";
  }, [visibleProjects]);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clients.length) return;
    const form = new FormData(event.currentTarget);
    const clientId = String(form.get("clientId"));
    const name = String(form.get("name"));
    const description = String(form.get("description"));
    const status = String(form.get("status")) as "planning" | "wip" | "done";
    const startDate = String(form.get("startDate"));
    const endDate = String(form.get("endDate"));
    const budget = Number(form.get("budget"));
    const currency = String(form.get("currency")) as "USD" | "ARS" | "COP";
    addProject({
      clientId,
      name,
      description,
      status,
      startDate,
      endDate,
      budget,
      currency,
      allocations: allocations.map((allocation) => ({ ...allocation })),
    });
    event.currentTarget.reset();
    setAllocations(defaultAllocations.map((allocation) => ({ ...allocation, id: crypto.randomUUID() })));
  };

  const updateAllocation = (id: string, field: keyof AllocationForm, value: string) => {
    setAllocations((prev) =>
      prev.map((allocation) => {
        if (allocation.id !== id) return allocation;
        if (field === "percentage" || field === "fixedAmount") {
          return { ...allocation, [field]: Number(value) };
        }
        return { ...allocation, [field]: value };
      }),
    );
  };

  const addEmptyAllocation = () => {
    setAllocations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "Colaborador",
        role: "collaborator",
        percentage: 0,
      },
    ]);
  };

  const removeAllocation = (id: string) => {
    setAllocations((prev) => prev.filter((allocation) => allocation.id !== id));
  };

  return (
    <div className="grid gap-8">
      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Proyectos</h1>
            <p className="text-sm text-[color:var(--text-secondary)] max-w-2xl">
              Gestiona presupuestos, estados y allocations para calcular márgenes automáticamente y dar visibilidad a Milo y Sergio.
            </p>
          </div>
          <div className="tag">{visibleProjects.length} proyectos</div>
        </div>
        <div className="surface-muted mt-6 grid gap-3 md:grid-cols-4">
          <Summary label="Planning" value={visibleProjects.filter((project) => project.status === "planning").length} />
          <Summary label="En progreso" value={visibleProjects.filter((project) => project.status === "wip").length} />
          <Summary label="Finalizados" value={visibleProjects.filter((project) => project.status === "done").length} />
          <Summary label="Presupuesto total" value={budgetSummary} />
        </div>
      </section>

      {user?.role === "owner" && (
        <section className="surface">
          <form onSubmit={handleCreate} className="grid gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Crear nuevo proyecto</h2>
              <p className="text-xs text-[color:var(--text-secondary)]">Completa la información base y distribuye el split.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Cliente
                <select
                  name="clientId"
                  required
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Nombre del proyecto
                <input
                  name="name"
                  required
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Descripción
              <textarea
                name="description"
                rows={2}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Estado
                <select
                  name="status"
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                >
                  <option value="planning">Planning</option>
                  <option value="wip">En progreso</option>
                  <option value="done">Finalizado</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Inicio
                <input
                  name="startDate"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Fin
                <input
                  name="endDate"
                  type="date"
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Moneda
                <select
                  name="currency"
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                  <option value="COP">COP</option>
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Presupuesto
              <input
                name="budget"
                type="number"
                min={0}
                step="0.01"
                required
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Allocations</span>
                <button
                  type="button"
                  onClick={addEmptyAllocation}
                  className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)] hover:border-emerald-400"
                >
                  Añadir
                </button>
              </div>
              <div className="grid gap-3">
                {allocations.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="grid gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4 md:grid-cols-4"
                  >
                    <input
                      value={allocation.name}
                      onChange={(event) => updateAllocation(allocation.id, "name", event.target.value)}
                      placeholder="Nombre"
                      className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-2 text-sm text-[color:var(--text-primary)]"
                    />
                    <select
                      value={allocation.role}
                      onChange={(event) => updateAllocation(allocation.id, "role", event.target.value)}
                      className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-2 text-sm text-[color:var(--text-primary)]"
                    >
                      <option value="milo">Milo</option>
                      <option value="sergio">Sergio</option>
                      <option value="collaborator">Colaborador</option>
                    </select>
                    <input
                      type="number"
                      value={allocation.percentage ?? 0}
                      onChange={(event) => updateAllocation(allocation.id, "percentage", event.target.value)}
                      placeholder="%"
                      className="rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-2 text-sm text-[color:var(--text-primary)]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={allocation.fixedAmount ?? 0}
                        onChange={(event) => updateAllocation(allocation.id, "fixedAmount", event.target.value)}
                        placeholder="Monto fijo"
                        className="w-full rounded-xl border border-[color:var(--border-subtle)] bg-white/90 px-4 py-2 text-sm text-[color:var(--text-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => removeAllocation(allocation.id)}
                        className="rounded-full border border-rose-400/70 px-3 py-1 text-xs text-rose-500 hover:bg-rose-50"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Crear proyecto
            </button>
          </form>
        </section>
      )}

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Listado de proyectos</h2>
        <div className="mt-4 grid gap-4">
          {visibleProjects.map((project) => {
            const client = clients.find((client) => client.id === project.clientId);
            return (
              <article
                key={project.id}
                className="grid gap-4 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="grid gap-1">
                    <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{project.name}</h3>
                    <p className="text-xs text-[color:var(--text-secondary)]">{client?.name ?? project.clientId}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                    <span className="tag">{project.status}</span>
                    <span className="tag">
                      Presupuesto {project.currency} {project.budget.toLocaleString()}
                    </span>
                    <span className="tag">Inicio {project.startDate}</span>
                    {project.endDate && <span className="tag">Fin {project.endDate}</span>}
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-[color:var(--text-secondary)]">{project.description}</p>
                )}
                <div className="grid gap-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Allocations</p>
                  <div className="flex flex-wrap gap-2 text-xs text-[color:var(--text-secondary)]">
                    {project.allocations.map((allocation) => (
                      <span
                        key={allocation.id}
                        className="rounded-full border border-emerald-400/60 bg-emerald-50 px-3 py-1 text-emerald-600"
                      >
                        {allocation.name} · {allocation.percentage ?? 0}%
                        {allocation.fixedAmount
                          ? ` · ${project.currency} ${allocation.fixedAmount.toLocaleString()}`
                          : ""}
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

function Summary({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/90 p-4 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[color:var(--text-primary)]">{value}</p>
    </div>
  );
}
