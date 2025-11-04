"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { Modal } from "@/components/modal";

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
  const { projects, clients, addProject, updateProject } = useData();
  const [allocations, setAllocations] = useState<AllocationForm[]>(defaultAllocations);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const visibleProjects = useMemo(() => {
    if (user && user.role !== "collaborator") return projects;
    if (!user) return [];
    return projects.filter((project) =>
      project.allocations.some((allocation) =>
        allocation.name.toLowerCase().includes((user.name ?? "").toLowerCase()),
      ),
    );
  }, [projects, user]);

  const projectToEdit = useMemo(
    () => projects.find((project) => project.id === editingProjectId) ?? null,
    [editingProjectId, projects],
  );

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
    const brand = String(form.get("brand") ?? "");
    const description = String(form.get("description"));
    const status = String(form.get("status")) as "planning" | "wip" | "done";
    const startDate = String(form.get("startDate"));
    const endDate = String(form.get("endDate"));
    const budget = Number(form.get("budget"));
    const currency = String(form.get("currency")) as "USD" | "ARS" | "COP";
    addProject({
      clientId,
      name,
      brand,
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
    setIsCreateOpen(false);
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProjectId) return;
    const form = new FormData(event.currentTarget);
    updateProject(editingProjectId, {
      clientId: String(form.get("clientId")),
      name: String(form.get("name")),
      brand: String(form.get("brand") ?? ""),
      description: String(form.get("description")),
      status: String(form.get("status")) as "planning" | "wip" | "done",
      startDate: String(form.get("startDate")),
      endDate: String(form.get("endDate")),
      budget: Number(form.get("budget")),
      currency: String(form.get("currency")) as "USD" | "ARS" | "COP",
    });
    setEditingProjectId(null);
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
          <div className="flex flex-wrap items-center gap-3">
            <span className="tag">{visibleProjects.length} proyectos</span>
            {user && user.role !== "collaborator" ? (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:border-[color:var(--text-primary)]"
              >
                Nuevo proyecto
              </button>
            ) : null}
          </div>
        </div>
        <div className="surface-muted mt-6 grid gap-3 md:grid-cols-4">
          <Summary label="Planning" value={visibleProjects.filter((project) => project.status === "planning").length} />
          <Summary label="En progreso" value={visibleProjects.filter((project) => project.status === "wip").length} />
          <Summary label="Finalizados" value={visibleProjects.filter((project) => project.status === "done").length} />
          <Summary label="Presupuesto total" value={budgetSummary} />
        </div>
      </section>


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
                    {project.brand ? (
                      <p className="text-xs text-[color:var(--text-secondary)]">Marca: {project.brand}</p>
                    ) : null}
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
                {user && user.role !== "collaborator" ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingProjectId(project.id)}
                      className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)] transition hover:border-[color:var(--text-primary)]"
                    >
                      Editar proyecto
                    </button>
                  </div>
                ) : null}
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

      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo proyecto"
        description="Distribuye presupuestos y allocations antes de iniciar la producción."
        widthClassName="max-w-4xl"
      >
        <form onSubmit={handleCreate} className="mt-6 grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
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
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Marca
              <input
                name="brand"
                placeholder="Producto o marca final"
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
          <div className="grid gap-4 md:grid-cols-2">
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
              Presupuesto
              <input
                name="budget"
                type="number"
                required
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Fecha inicio
              <input
                type="date"
                name="startDate"
                required
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Fecha cierre
              <input
                type="date"
                name="endDate"
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              <span>Split del equipo</span>
              <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/80 p-4 text-xs text-[color:var(--text-secondary)]">
                Ajusta porcentajes y montos desde la sección &quot;Allocations&quot; abajo.
              </div>
            </div>
          </div>
          <details className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[color:var(--text-primary)]" style={{ listStyle: "none" }}>
              Allocations
            </summary>
            <div className="mt-4 grid gap-3">
              {allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="grid gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-white/80 p-4 md:grid-cols-4"
                >
                  <input
                    value={allocation.name}
                    onChange={(event) => updateAllocation(allocation.id, "name", event.target.value)}
                    className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
                  />
                  <select
                    value={allocation.role}
                    onChange={(event) => updateAllocation(allocation.id, "role", event.target.value)}
                    className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
                  >
                    <option value="milo">Milo</option>
                    <option value="sergio">Sergio</option>
                    <option value="collaborator">Colaborador</option>
                  </select>
                  <input
                    type="number"
                    value={allocation.percentage ?? 0}
                    onChange={(event) => updateAllocation(allocation.id, "percentage", event.target.value)}
                    className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
                    placeholder="%"
                  />
                  <button
                    type="button"
                    onClick={() => removeAllocation(allocation.id)}
                    className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50"
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addEmptyAllocation}
                className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)] hover:border-[color:var(--text-primary)]"
              >
                Añadir integrante
              </button>
            </div>
          </details>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full px-5 py-2 text-xs font-semibold text-white"
              style={{ background: "var(--brand-accent)" }}
            >
              Crear proyecto
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingProjectId)}
        onClose={() => setEditingProjectId(null)}
        title={projectToEdit ? `Editar ${projectToEdit.name}` : "Editar proyecto"}
        description="Actualiza la marca, fechas y presupuesto sin perder el histórico."
        widthClassName="max-w-4xl"
      >
        {projectToEdit ? (
          <form onSubmit={handleUpdate} className="mt-6 grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Cliente
                <select
                  name="clientId"
                  defaultValue={projectToEdit.clientId}
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
                  defaultValue={projectToEdit.name}
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Marca
                <input
                  name="brand"
                  defaultValue={projectToEdit.brand ?? ""}
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
              Descripción
              <textarea
                name="description"
                defaultValue={projectToEdit.description ?? ""}
                rows={2}
                className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Estado
                <select
                  name="status"
                  defaultValue={projectToEdit.status}
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
                  type="date"
                  name="startDate"
                  defaultValue={projectToEdit.startDate}
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Fin
                <input
                  type="date"
                  name="endDate"
                  defaultValue={projectToEdit.endDate ?? ""}
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Moneda
                <select
                  name="currency"
                  defaultValue={projectToEdit.currency}
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                  <option value="COP">COP</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
                Presupuesto
                <input
                  type="number"
                  name="budget"
                  defaultValue={projectToEdit.budget}
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingProjectId(null)}
                className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-400"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
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
