const heroBadges = [
  "Dominio · billing.monteanimation.com",
  "Login con Google Workspace",
  "Zona admin + zona colaboradores",
];

const userRoles = [
  {
    title: "Owners (Milo & Sergio)",
    description:
      "Control total sobre configuraciones, reportes, importaciones y gestión de reglas financieras. Visualizan balances globales al instante.",
  },
  {
    title: "Colaboradores",
    description:
      "Acceso seguro y acotado a sus proyectos, gastos y pagos asignados. Notificaciones solo de su actividad relevante.",
  },
];

const authFeatures = [
  "Registro con email/contraseña y validación por correo",
  "Inicio de sesión con Google OAuth (Monte Workspace)",
  "Recuperación de contraseña y cierre de sesión seguro",
  "Perfil editable: avatar, nombre, teléfono, zona horaria, idioma, moneda y datos bancarios",
  "Preferencias de notificación por canal (email, Slack)",
];

const modules = [
  {
    title: "Clientes & Proyectos",
    description:
      "CRUD completo con presupuesto, fechas clave, estados (planning / WIP / done) y asignaciones automáticas por porcentaje o monto fijo.",
    bullets: [
      "Historial y notas centralizadas por proyecto",
      "Control de moneda base y presupuesto restante",
      "Asignación visual para Milo, Sergio y colaboradores",
    ],
  },
  {
    title: "Invoices",
    description:
      "Generación con numeración automática, plantilla PDF igual a la actual y envío por email al cliente desde la app.",
    bullets: [
      "Estados draft / sent / partial / paid / void",
      "PDF almacenado en Supabase Storage y Google Drive",
      "Adjuntos opcionales y observaciones",
    ],
  },
  {
    title: "Pagos",
    description:
      "Registro manual o importado desde CSV con validaciones de moneda y tipo de cambio. Aplica caja chica y split automáticamente.",
    bullets: [
      "Regla de Fondo Monte configurable (porcentaje o fijo)",
      "Split inmediato entre Milo / Sergio / Colabs según allocation",
      "Actualización de balances personales y del dashboard en vivo",
    ],
  },
  {
    title: "Notas & Ajustes",
    description:
      "Asientos internos del tipo “Cuenta A → Cuenta B” (ej. Sergio → Milo 537 USD) que impactan balances y ledger histórico.",
    bullets: [
      "Categorías personalizadas y filtros por usuario",
      "Registro de reintegros y transferencias externas",
      "Auditoría completa con timestamp y autor",
    ],
  },
  {
    title: "Gastos",
    description:
      "Carga de gastos facturables y no facturables con adjuntos, categorías y aprobación por parte del admin.",
    bullets: [
      "Carga rápida por colaboradores con límites de visibilidad",
      "Conversión automática a USD para el dashboard",
      "Control de pagos pendientes a colaboradores",
    ],
  },
  {
    title: "Caja chica & Fondo Monte",
    description:
      "Ledger con todos los movimientos automáticos y manuales del fondo. Configurable desde el panel de administración.",
    bullets: [
      "Simulación de impacto antes de aplicar cambios",
      "Historial exportable a CSV/Excel",
      "Alertas automáticas por Slack cuando baja de cierto umbral",
    ],
  },
];

const financeFeatures = [
  {
    title: "Multimoneda",
    items: [
      "currency.js + dayjs para cálculos en USD / ARS / COP",
      "Registro de tipo de cambio diario y ajustes automáticos",
      "Visualización dual: moneda original + conversión a USD",
    ],
  },
  {
    title: "Reportes",
    items: [
      "AR Aging (0–30 / 31–60 / 61–90 / +90 días)",
      "Margen por proyecto y por cliente",
      "Balance Milo / Sergio y saldo Fondo Monte",
      "Exportación a CSV o Google Sheets",
    ],
  },
  {
    title: "Importador CSV",
    items: [
      "Mapeo automático del Excel actual",
      "Parseo de columna “comentarios” a notas/ajustes",
      "Validaciones de moneda, fechas y duplicados",
      "Vista previa antes de confirmar la importación",
    ],
  },
];

const flows = [
  {
    step: "1",
    title: "Setup inicial",
    description:
      "Owners configuran reglas de caja chica, monedas disponibles, categorías de gasto y plantillas de invoice desde la zona de administración.",
  },
  {
    step: "2",
    title: "Operación diaria",
    description:
      "Colaboradores cargan gastos y avances. Owners crean proyectos e invoices, envían PDF y registran pagos.",
  },
  {
    step: "3",
    title: "Automatización",
    description:
      "Cada pago distribuye fondos automáticamente y registra movimientos en balances personales y Fondo Monte.",
  },
  {
    step: "4",
    title: "Control & Reportes",
    description:
      "Dashboard con KPIs en tiempo real, reportes de AR Aging, márgenes y exportaciones para contabilidad.",
  },
];

const stack = [
  "Next.js + React (TypeScript) + Tailwind + shadcn/ui",
  "Node.js + Prisma + Postgres (Supabase o Neon)",
  "NextAuth (email/password + Google OAuth)",
  "Supabase Storage para adjuntos y PDFs",
  "React-PDF para plantillas de factura",
  "Resend/SMTP para envío de emails",
  "Cron jobs (Vercel / Trigger.dev) para recordatorios",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-24 pt-20 sm:pt-28">
        <section className="grid gap-12 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950 p-12 shadow-2xl ring-1 ring-white/10 md:grid-cols-[1.6fr,1fr]">
          <div className="space-y-6">
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">Monte Billing</span>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Sistema web de gestión financiera simple y colaborativo para Monte Animation
            </h1>
            <p className="max-w-2xl text-lg text-zinc-300">
              Unificamos clientes, proyectos, facturación, pagos, caja chica y reportes en una plataforma segura que reemplaza el Excel actual.
              Diseñada para operar online, con autenticación moderna y control granular de accesos.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
              {heroBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-emerald-500/40 px-3 py-1">
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
            <div>
              <p className="text-sm font-medium text-emerald-300">KPIs en el dashboard</p>
              <ul className="mt-3 space-y-3 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-emerald-400" />
                  <span>Facturado del mes, cuentas por cobrar y saldo del Fondo Monte.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-emerald-400" />
                  <span>Balances personales de Milo y Sergio con desglose por movimiento.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-emerald-400" />
                  <span>Estado global de proyectos e invoices (draft/sent/partial/paid).</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl bg-zinc-950/60 p-4 text-xs text-zinc-400">
              <p className="font-medium text-zinc-200">Fases de entrega</p>
              <p className="mt-2">Fase 1 (6 semanas): MVP completo. Fase 2 (4 semanas): reportes avanzados, webhooks y optimización mobile.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          {userRoles.map((role) => (
            <article key={role.title} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
              <h2 className="text-xl font-semibold text-emerald-300">{role.title}</h2>
              <p className="text-sm text-zinc-300">{role.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr,1fr]">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold">Autenticación & administración de usuarios</h2>
              <p className="text-sm text-zinc-300">
                La plataforma separa claramente la zona de administración y la zona de colaboradores, manteniendo seguridad con JWT + cookies httpOnly y NextAuth.
              </p>
              <ul className="space-y-3 text-sm text-zinc-300">
                {authFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-sm text-emerald-100">
              <h3 className="text-lg font-semibold text-emerald-200">Panel del colaborador</h3>
              <p className="mt-3 text-emerald-100">
                Vista dedicada con tareas asignadas, gastos cargados, pagos pendientes y acceso rápido al historial de invoices relacionados.
              </p>
              <p className="mt-3 text-emerald-100">
                Acceso restringido por proyecto y sin posibilidad de modificar configuraciones globales.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold">Módulos operativos del MVP</h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                Cada módulo reemplaza directamente procesos manuales del Excel, con interfaces simples tipo tabla + formulario y automatizaciones clave para Monte Animation.
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
              MVP · Fase 1
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {modules.map((module) => (
              <article key={module.title} className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
                <div>
                  <h3 className="text-xl font-semibold text-emerald-300">{module.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{module.description}</p>
                </div>
                <ul className="mt-auto space-y-2 text-xs text-zinc-400">
                  {module.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-3">
          {financeFeatures.map((feature) => (
            <article key={feature.title} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
              <h3 className="text-lg font-semibold text-emerald-300">{feature.title}</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                {feature.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-10">
          <div className="grid gap-10 md:grid-cols-2">
            {flows.map((flow) => (
              <div key={flow.step} className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 flex-none items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-lg font-semibold text-emerald-300">
                  {flow.step}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-emerald-200">{flow.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{flow.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1fr,1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8">
            <h2 className="text-3xl font-semibold">Stack sugerido & buenas prácticas</h2>
            <p className="mt-3 text-sm text-zinc-300">
              Arquitectura moderna orientada a performance, seguridad y colaboración. Cada componente está alineado con el ecosistema actual de Monte Animation.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              {stack.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-emerald-100">
            <h2 className="text-3xl font-semibold text-emerald-100">Dashboard + Tablas simples</h2>
            <p className="mt-3">
              Interfaces limpias con tablas filtrables, panel de cards para KPIs y formularios claros. Modo oscuro por defecto, responsive y optimizado para carga rápida en cualquier dispositivo.
            </p>
            <p className="mt-3">
              Exportación CSV en cada tabla, búsqueda rápida y filtros por cliente, estado, fecha y moneda.
            </p>
            <p className="mt-3">
              Indicadores visuales para diferenciar estados de invoices, pagos y aprobaciones de gastos.
            </p>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-white/5 pt-10 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Monte Billing · Plataforma financiera colaborativa © {new Date().getFullYear()}</p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-white/10 px-3 py-1">Seguridad · JWT + HTTPS</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Slack · Notificaciones automáticas</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Google Drive · PDFs centralizados</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
