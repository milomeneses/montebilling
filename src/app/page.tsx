const roles = [
  {
    role: "Owner / Admin",
    description:
      "Acceso completo a configuración, proyectos, reportes e integraciones. Control total sobre reglas de caja chica y asignaciones.",
  },
  {
    role: "Colaborador",
    description:
      "Ve y gestiona únicamente sus proyectos, gastos y pagos asignados. Experiencia enfocada en tareas diarias.",
  },
  {
    role: "Cliente (opcional)",
    description:
      "Acceso de solo lectura a facturas y estados de pago para un seguimiento transparente.",
  },
];

const modules = [
  {
    title: "Dashboard",
    description:
      "KPIs en tiempo real para facturación mensual, cuentas por cobrar, saldo de caja chica y balances personales de Milo y Sergio.",
    highlights: [
      "Gráficos de flujo mensual", "Filtros por cliente, estado y fecha", "Indicadores globales siempre actualizados",
    ],
  },
  {
    title: "Proyectos",
    description:
      "Gestión integral con estados, presupuestos multimoneda y asignaciones automáticas para Milo, Sergio y colaboradores.",
    highlights: [
      "Cálculo automático de márgenes", "Split configurable por porcentaje o monto", "Historial y notas centralizadas",
    ],
  },
  {
    title: "Invoices",
    description:
      "Creación, numeración y envío de facturas con exportación PDF y envío directo al cliente desde Monte Billing.",
    highlights: [
      "Plantilla Monte Animation", "Estados draft → paid", "Guardado automático en Google Drive",
    ],
  },
  {
    title: "Pagos",
    description:
      "Registro manual o importado desde CSV. Distribución automática hacia caja chica y balances personales.",
    highlights: [
      "Split inmediato", "Sincronización con dashboard", "Notificaciones a Slack #finanzas",
    ],
  },
  {
    title: "Caja chica",
    description:
      "Regla configurable por porcentaje o monto fijo con ledger de movimientos automáticos y manuales.",
    highlights: [
      "Saldo del fondo Monte", "Trazabilidad completa", "Ajustes retroactivos controlados",
    ],
  },
  {
    title: "Notas & Ajustes",
    description:
      "Asientos contables internos para registrar transferencias y reintegros con impacto automático en balances.",
    highlights: ["Filtros por usuario y categoría", "Historial auditable", "Automatización de balances"],
  },
];

const integrations = [
  {
    phase: "Fase 1 (MVP)",
    items: [
      "Autenticación con Google Workspace",
      "Notificaciones automáticas a Slack #finanzas",
      "Almacenamiento de PDFs en Google Drive y exportación a Sheets",
    ],
  },
  {
    phase: "Fase 2",
    items: [
      "Sincronización con Asana y Frame.io",
      "Webhooks para Zapier/Make",
      "Recordatorios automáticos y optimización mobile",
    ],
  },
];

const stack = [
  "Next.js + React (TypeScript) + Tailwind + shadcn/ui",
  "Node.js + Prisma + Postgres (Supabase/Neon)",
  "NextAuth (email + Google OAuth)",
  "Supabase Storage, Resend y cron jobs programados",
  "currency.js + dayjs para multimoneda",
];

const acceptance = [
  "Registro, login y acceso con Google",
  "Flujo admin: proyecto → invoice → pago con split automático",
  "Generación PDF con numeración secuencial",
  "Dashboard con KPIs reales y colaboradores con permisos restringidos",
  "Importación desde Excel y notificaciones a Slack",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-24 pt-24 sm:pt-32">
        <section className="grid gap-10 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 p-12 shadow-2xl ring-1 ring-white/10 md:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">Monte Billing App</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Plataforma financiera colaborativa para Monte Animation
            </h1>
            <p className="max-w-2xl text-lg text-zinc-300">
              Reemplazamos el Excel por una aplicación moderna enfocada en automatizar facturación, proyectos, balances personales y caja chica.
              Experiencia optimizada para Milo, Sergio, colaboradores y clientes con reportes claros en tiempo real.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
              <span className="rounded-full border border-emerald-500/40 px-3 py-1">Dominio · billing.monteanimation.com</span>
              <span className="rounded-full border border-emerald-500/40 px-3 py-1">Seguridad · JWT + cookies httpOnly</span>
              <span className="rounded-full border border-emerald-500/40 px-3 py-1">Deploy · Vercel / Render</span>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/5 bg-zinc-900/60 p-6 text-sm text-zinc-300">
            <div>
              <p className="font-semibold text-zinc-100">KPIs iniciales</p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-emerald-400" />
                  <span>Facturado en el mes, total por cobrar y saldo del Fondo Monte.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-emerald-400" />
                  <span>Balances personales de Milo y Sergio actualizados en tiempo real.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-emerald-400" />
                  <span>Importación desde Excel y generación de PDFs en la nube.</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl bg-zinc-950/60 p-4 text-xs text-zinc-400">
              <p className="font-medium text-zinc-200">Linea de tiempo</p>
              <p className="mt-2">Fase 1: 6 semanas para MVP · Fase 2: 4 semanas para integraciones avanzadas.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-3">
          {roles.map((role) => (
            <article key={role.role} className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold text-emerald-300">{role.role}</h2>
              <p className="text-sm text-zinc-300">{role.description}</p>
            </article>
          ))}
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">Módulos principales</h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                Cada módulo está diseñado para automatizar el flujo financiero de Monte Animation, con foco en simplicidad, control y colaboración en tiempo real.
              </p>
            </div>
            <span className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300 md:block">
              MVP · Fase 1
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {modules.map((module) => (
              <article key={module.title} className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                <div>
                  <h3 className="text-xl font-semibold text-emerald-300">{module.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{module.description}</p>
                </div>
                <ul className="space-y-2 text-xs text-zinc-400">
                  {module.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-12 lg:grid-cols-[1.2fr,1fr]">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold">Integraciones clave</h2>
            <p className="max-w-xl text-sm text-zinc-300">
              El ecosistema Monte Animation se potencia con automatizaciones hacia Slack, Google Workspace, Asana y herramientas creativas. Fase 1 se enfoca en notificaciones y almacenamiento; Fase 2 expande a flujos operativos.
            </p>
            <div className="space-y-4">
              {integrations.map((integration) => (
                <article key={integration.phase} className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                  <h3 className="text-lg font-semibold text-emerald-300">{integration.phase}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    {integration.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
          <aside className="flex flex-col gap-6 rounded-3xl border border-white/5 bg-zinc-900/60 p-8">
            <div>
              <h3 className="text-lg font-semibold text-emerald-300">Stack tecnológico</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {stack.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-300">Criterios de aceptación</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {acceptance.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/5 bg-zinc-900/60 p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold">Roadmap de implementación</h2>
              <p className="text-sm text-zinc-300">
                Fase 1 entrega el MVP en 6 semanas con autenticación, dashboard, módulos principales, PDF generator, importador CSV y primeras integraciones. Fase 2 añade reportes avanzados, automatizaciones con Asana/Frame.io, webhooks y refinamientos UI.
              </p>
            </div>
            <div className="grid gap-4 text-sm text-zinc-300 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Fase 1</p>
                <p className="mt-2 font-semibold text-zinc-100">MVP listo para operar</p>
                <p className="mt-1 text-xs">Dashboard, proyectos, invoices, pagos, caja chica, notas, integraciones Slack + Drive.</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Fase 2</p>
                <p className="mt-2 font-semibold text-zinc-100">Automatización extendida</p>
                <p className="mt-1 text-xs">Reportes avanzados, integraciones creativas y mobile optimizado.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-white/5 pt-10 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Monte Billing · Plataforma financiera colaborativa © {new Date().getFullYear()}</p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-white/10 px-3 py-1">Soporte Workspace</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Seguridad reforzada</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Actualizaciones continuas</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
