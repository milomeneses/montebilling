"use client";

import { ChangeEvent, FormEvent, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

export default function SettingsPage() {
  const { user, users: authUsers, adminUpdateUser, adminRemoveUser, adminResetPassword } = useAuth();
  const {
    pettyCash,
    updatePettyCashRule,
    addExchangeRate,
    exchangeRates,
    integrations,
    updateIntegrations,
    appTemplate,
    updateAppTemplate,
    resetAppTemplate,
  } = useData();
  const [ruleType, setRuleType] = useState<"percent" | "fixed">(pettyCash.ruleType);
  const [ruleValue, setRuleValue] = useState<number>(pettyCash.value);
  const [passwordHints, setPasswordHints] = useState<Record<string, string>>({});

  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return (
      <section className="surface">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Configuración financiera</h1>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Solo los owners o administradores pueden modificar reglas de caja chica, integraciones y tipos de cambio.
        </p>
      </section>
    );
  }

  const handleRuleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updatePettyCashRule({ ruleType, value: ruleValue });
  };

  const handleRateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fromCurrency = String(form.get("fromCurrency")) as "USD" | "ARS" | "COP";
    const toCurrency = String(form.get("toCurrency")) as "USD" | "ARS" | "COP";
    const rate = Number(form.get("rate"));
    const date = String(form.get("date"));
    addExchangeRate({ fromCurrency, toCurrency, rate, date });
    event.currentTarget.reset();
  };

  const handleIntegrationToggle = (key: keyof typeof integrations) => (event: ChangeEvent<HTMLInputElement>) => {
    updateIntegrations(key, { enabled: event.target.checked });
  };

  const handleTemplateColorChange = (field: "primaryColor" | "secondaryColor") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      updateAppTemplate({ [field]: event.target.value });
    };

  const handleTemplateFontChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateAppTemplate({ fontFamily: event.target.value });
  };

  const handleCustomHtmlChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateAppTemplate({ customHtml: event.target.value });
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateAppTemplate({ logoDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUserUpdate = (id: string) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const role = form.get("role") as "admin" | "owner" | "collaborator";
    const timezone = String(form.get("timezone"));
    const preferredCurrency = String(form.get("preferredCurrency")) as "USD" | "ARS" | "COP";
    adminUpdateUser(id, {
      role,
      timezone,
      preferredCurrency,
      notifications: {
        email: form.get("notifyEmail") === "on",
        slack: form.get("notifySlack") === "on",
      },
    });
  };

  const handleResetPassword = (id: string) => {
    const generated = adminResetPassword(id);
    if (generated) {
      setPasswordHints((prev) => ({ ...prev, [id]: generated }));
    }
  };

  return (
    <div className="grid gap-8">
      <section className="surface">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Configuración financiera</h1>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Ajusta la regla de caja chica y mantén actualizados los tipos de cambio para las conversiones automáticas.
        </p>

        <form onSubmit={handleRuleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Tipo de regla
            <select
              value={ruleType}
              onChange={(event) => setRuleType(event.target.value as "percent" | "fixed")}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            >
              <option value="percent">Porcentaje del pago</option>
              <option value="fixed">Monto fijo</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Valor
            <input
              type="number"
              min={0}
              step="0.01"
              value={ruleValue}
              onChange={(event) => setRuleValue(Number(event.target.value))}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Guardar regla de caja chica
          </button>
        </form>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Plantilla de la aplicación</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Define logo, colores y tipografía global. También puedes inyectar HTML personalizado para banners o código de seguimiento.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Color primario
            <input
              type="color"
              value={appTemplate.primaryColor}
              onChange={handleTemplateColorChange("primaryColor")}
              className="h-10 w-16 rounded-md border border-[color:var(--border-subtle)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Color secundario
            <input
              type="color"
              value={appTemplate.secondaryColor}
              onChange={handleTemplateColorChange("secondaryColor")}
              className="h-10 w-16 rounded-md border border-[color:var(--border-subtle)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)] md:col-span-2">
            Tipografía global
            <input
              value={appTemplate.fontFamily}
              onChange={handleTemplateFontChange}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)] md:col-span-2">
            Logo (PNG o JPG)
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoUpload}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm"
            />
          </label>
        </div>

        <label className="mt-4 grid gap-2 text-sm text-[color:var(--text-secondary)]">
          HTML personalizado
          <textarea
            value={appTemplate.customHtml ?? ""}
            onChange={handleCustomHtmlChange}
            rows={4}
            className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
          />
        </label>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Previsualización</p>
            <div className="mt-3 flex items-center gap-3">
              {appTemplate.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={appTemplate.logoDataUrl} alt="Logo" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="rounded-full bg-[color:var(--surface-muted)] px-3 py-2 text-xs font-semibold text-[color:var(--text-secondary)]">
                  Sin logo
                </span>
              )}
              <div className="text-sm text-[color:var(--text-secondary)]">
                <p style={{ color: appTemplate.primaryColor }}>Color primario</p>
                <p style={{ color: appTemplate.secondaryColor }}>Color secundario</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={resetAppTemplate}
              className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)] hover:border-[color:var(--text-primary)]"
            >
              Restablecer plantilla
            </button>
          </div>
        </div>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Integraciones críticas</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Activa o desactiva conexiones con Google, Slack, Drive y el proveedor de emails. Todos los cambios se almacenan en localStorage para este demo.
        </p>

        <div className="mt-6 grid gap-6">
          <IntegrationCard
            title="Google OAuth"
            description="Acceso con cuentas de Monte Animation."
            enabled={integrations.googleOAuth.enabled}
            onToggle={handleIntegrationToggle("googleOAuth")}
          >
            <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
              Client ID
              <input
                value={integrations.googleOAuth.clientId}
                onChange={(event) => updateIntegrations("googleOAuth", { clientId: event.target.value })}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
              Client secret
              <input
                value={integrations.googleOAuth.clientSecret}
                onChange={(event) => updateIntegrations("googleOAuth", { clientSecret: event.target.value })}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
              Redirect URI
              <input
                value={integrations.googleOAuth.redirectUri}
                onChange={(event) => updateIntegrations("googleOAuth", { redirectUri: event.target.value })}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <small className="text-xs text-[color:var(--text-secondary)]">Última sincronización: {integrations.googleOAuth.lastSynced ?? "nunca"}</small>
          </IntegrationCard>

          <IntegrationCard
            title="Slack #finanzas"
            description="Envía avisos de facturas y pagos al canal de finanzas."
            enabled={integrations.slack.enabled}
            onToggle={handleIntegrationToggle("slack")}
          >
            <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
              Webhook URL
              <input
                value={integrations.slack.webhookUrl}
                onChange={(event) => updateIntegrations("slack", { webhookUrl: event.target.value })}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
              Canal
              <input
                value={integrations.slack.channel}
                onChange={(event) => updateIntegrations("slack", { channel: event.target.value })}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <small className="text-xs text-[color:var(--text-secondary)]">Última notificación: {integrations.slack.lastNotification ?? "nunca"}</small>
          </IntegrationCard>

          <IntegrationCard
            title="Google Drive"
            description="Copia automática de PDFs en la carpeta Facturas Monte."
            enabled={integrations.drive.enabled}
            onToggle={handleIntegrationToggle("drive")}
          >
            <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
              Folder ID
              <input
                value={integrations.drive.folderId}
                onChange={(event) => updateIntegrations("drive", { folderId: event.target.value })}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
              Service account
              <input
                value={integrations.drive.serviceAccount}
                onChange={(event) => updateIntegrations("drive", { serviceAccount: event.target.value })}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            <small className="text-xs text-[color:var(--text-secondary)]">Última exportación: {integrations.drive.lastExport ?? "nunca"}</small>
          </IntegrationCard>

          <IntegrationCard
            title="Email (Resend / SMTP)"
            description="Define el remitente de las notificaciones de facturas."
            enabled={integrations.email.enabled}
            onToggle={handleIntegrationToggle("email")}
          >
            <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
              Proveedor
              <select
                value={integrations.email.provider}
                onChange={(event) => updateIntegrations("email", { provider: event.target.value as "resend" | "smtp" })}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
              >
                <option value="resend">Resend</option>
                <option value="smtp">SMTP propio</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
              Correo remitente
              <input
                value={integrations.email.fromEmail}
                onChange={(event) => updateIntegrations("email", { fromEmail: event.target.value })}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
              />
            </label>
            {integrations.email.provider === "resend" ? (
              <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
                API key
                <input
                  value={integrations.email.apiKey ?? ""}
                  onChange={(event) => updateIntegrations("email", { apiKey: event.target.value })}
                  className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
                />
              </label>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
                  Host SMTP
                  <input
                    value={integrations.email.smtpHost ?? ""}
                    onChange={(event) => updateIntegrations("email", { smtpHost: event.target.value })}
                    className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
                  />
                </label>
                <label className="grid gap-1 text-xs text-[color:var(--text-secondary)]">
                  Puerto
                  <input
                    type="number"
                    value={integrations.email.smtpPort ?? 0}
                    onChange={(event) => updateIntegrations("email", { smtpPort: Number(event.target.value) })}
                    className="rounded-xl border border-[color:var(--border-subtle)] bg-white px-3 py-2 text-sm text-[color:var(--text-primary)]"
                  />
                </label>
              </div>
            )}
          </IntegrationCard>
        </div>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Control de usuarios</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Gestiona accesos del equipo, ajusta roles permitidos y resetea contraseñas de emergencia. Solo el administrador o los owners pueden realizar estos cambios.
        </p>

        <div className="mt-6 grid gap-4">
          {authUsers.map((account) => (
            <details
              key={account.id}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)]"
            >
              <summary
                className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5 text-left"
                style={{ listStyle: "none" }}
              >
                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{account.name}</h3>
                  <p className="text-xs text-[color:var(--text-secondary)]">{account.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  <span className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1 uppercase">{account.role}</span>
                  <span className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1">Zona horaria {account.timezone}</span>
                  <span className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1">Moneda {account.preferredCurrency}</span>
                </div>
              </summary>

              <div className="grid gap-4 border-t border-[color:var(--border-subtle)] p-5 text-sm text-[color:var(--text-secondary)]">
                <form onSubmit={handleUserUpdate(account.id)} className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    Rol
                    <select
                      name="role"
                      defaultValue={account.role}
                      className="rounded-2xl border border-[color:var(--border-subtle)] bg-white px-4 py-3 text-sm text-[color:var(--text-primary)]"
                    >
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                      <option value="collaborator">Colaborador</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    Zona horaria
                    <input
                      name="timezone"
                      defaultValue={account.timezone}
                      className="rounded-2xl border border-[color:var(--border-subtle)] bg-white px-4 py-3 text-sm text-[color:var(--text-primary)]"
                    />
                  </label>
                  <label className="grid gap-2">
                    Moneda preferida
                    <select
                      name="preferredCurrency"
                      defaultValue={account.preferredCurrency}
                      className="rounded-2xl border border-[color:var(--border-subtle)] bg-white px-4 py-3 text-sm text-[color:var(--text-primary)]"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                      <option value="COP">COP</option>
                    </select>
                  </label>
                  <div className="grid gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-white/80 p-4 text-xs">
                    <label className="inline-flex items-center gap-2">
                      <input
                        key={`${account.id}-email-${account.notifications.email ? "on" : "off"}`}
                        type="checkbox"
                        name="notifyEmail"
                        defaultChecked={account.notifications.email}
                        className="h-4 w-4 rounded"
                      />
                      Email operativo
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        key={`${account.id}-slack-${account.notifications.slack ? "on" : "off"}`}
                        type="checkbox"
                        name="notifySlack"
                        defaultChecked={account.notifications.slack}
                        className="h-4 w-4 rounded"
                      />
                      Avisos Slack
                    </label>
                    <p className="text-[color:var(--text-secondary)]">
                      Estas preferencias sincronizan notificaciones de facturas, pagos y recordatorios.
                    </p>
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="rounded-full border px-4 py-2 text-xs font-semibold text-[color:var(--text-primary)]"
                      style={{ borderColor: "var(--brand-accent)", color: "var(--brand-accent)" }}
                    >
                      Guardar cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetPassword(account.id)}
                      className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)] hover:border-[color:var(--text-primary)]"
                    >
                      Resetear contraseña
                    </button>
                    {passwordHints[account.id] ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">
                        Temporal: {passwordHints[account.id]}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => adminRemoveUser(account.id)}
                      disabled={account.role !== "collaborator"}
                      className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-500 disabled:cursor-not-allowed disabled:border-rose-100 disabled:text-rose-300"
                    >
                      Eliminar usuario
                    </button>
                  </div>
                </form>
                <p className="text-xs text-[color:var(--text-secondary)]">
                  Para incorporar nuevos colaboradores, utiliza el formulario de registro desde el login con el rol &quot;Colaborador&quot;.
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Registrar tipo de cambio</h2>
        <form onSubmit={handleRateSubmit} className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Desde
            <select
              name="fromCurrency"
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="COP">COP</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Hacia
            <select
              name="toCurrency"
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="COP">COP</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Tasa
            <input
              name="rate"
              type="number"
              required
              step="0.0001"
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[color:var(--text-secondary)]">
            Fecha
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            />
          </label>
          <button
            type="submit"
            className="md:col-span-4 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Registrar tipo de cambio
          </button>
        </form>

        <div className="mt-4 grid gap-2 text-xs text-[color:var(--text-secondary)]">
          {exchangeRates.map((rate) => (
            <div
              key={rate.id}
              className="flex flex-wrap items-center justify-between rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-4 py-2"
            >
              <span>
                {rate.date} · {rate.fromCurrency} → {rate.toCurrency}
              </span>
              <span>{rate.rate}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type IntegrationCardProps = {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (event: ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
};

function IntegrationCard({ title, description, enabled, onToggle, children }: IntegrationCardProps) {
  return (
    <article className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">{title}</h3>
          <p className="text-xs text-[color:var(--text-secondary)]">{description}</p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
          <input type="checkbox" checked={enabled} onChange={onToggle} className="h-4 w-4 rounded" />
          {enabled ? "Activo" : "Inactivo"}
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{children}</div>
    </article>
  );
}
