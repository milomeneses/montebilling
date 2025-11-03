import Link from "next/link";

const features = [
  {
    title: "Caja chica automatizada",
    description:
      "Configura reglas porcentuales o montos fijos y deja que los pagos actualicen el Fondo Monte sin hojas de cálculo.",
  },
  {
    title: "Split inteligente de ingresos",
    description:
      "Distribuye cada cobro entre Milo, Sergio y colaboradores según allocations por proyecto.",
  },
  {
    title: "Reportes en tiempo real",
    description:
      "Visualiza AR aging, márgenes y balances personales desde un dashboard único.",
  },
  {
    title: "Importación desde Excel",
    description:
      "Sube el histórico CSV del estudio y convierte comentarios en ajustes automáticos.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-20">
      <section className="grid gap-10 rounded-3xl border border-slate-800 bg-slate-900/50 p-10 backdrop-blur">
        <span className="inline-flex max-w-max items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
          Monte Billing App
        </span>
        <div className="grid gap-6">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Gestiona proyectos, facturas, pagos y balances sin depender de Excel.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Plataforma financiera colaborativa para Monte Animation con login por Google Workspace, zona de administración y zona de colaboradores.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/login"
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
          >
            Crear cuenta
          </Link>
        </div>
      </section>

      <section className="grid gap-6">
        <h2 className="text-2xl font-semibold">Todo lo que Monte necesita para facturar y pagar</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-100">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
        <h2 className="text-2xl font-semibold">Stack listo para producción</h2>
        <p className="max-w-3xl text-sm text-slate-300">
          Next.js + React (TypeScript), Prisma + Postgres, NextAuth con email y Google OAuth, React-PDF para facturas, Supabase Storage para adjuntos y cron jobs en la nube. Todo desplegado en billing.monteanimation.com con HTTPS.
        </p>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>Dashboard en tiempo real</span>
          <span>Zona de administración</span>
          <span>Zona de colaboradores</span>
          <span>Reportes exportables</span>
          <span>Seguridad con JWT + cookies httpOnly</span>
        </div>
      </section>
    </main>
  );
}
