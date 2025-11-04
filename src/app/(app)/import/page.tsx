"use client";

import { ChangeEvent, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";

type CsvRow = Record<string, string> & { type: string };

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const headers = lines[0].split(",").map((header) => header.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const row: CsvRow = { type: "" } as CsvRow;
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

export default function ImportPage() {
  const { user } = useAuth();
  const { importFromCsv } = useData();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (user?.role !== "owner") {
    return (
      <section className="surface">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Importador CSV</h1>
        <p className="text-sm text-[color:var(--text-secondary)] max-w-xl">
          Solo los owners pueden importar el histórico desde el Excel existente.
        </p>
      </section>
    );
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    const result = importFromCsv(rows);
    setFeedback(`${result.summary}. Revisa el dashboard para validar.`);
  };

  const sample = `type,client,project,amount,currency,date,notes,from,to,category,invoice,status\nclient,Winston Media,,,,,,,\nproject,Winston Media,Campaña Winston,45000,USD,2024-01-02,Spot global,,,\ninvoice,,Campaña Winston,18150,USD,2024-02-10,Primer milestone,,,\npayment,,,,18150,USD,2024-03-01,,transfer,,,\nadjustment,,,537,USD,2024-03-05,Reintegro,Sergio,Milo,Reintegro,\nexpense,,Campaña Winston,1200,USD,2024-03-04,Storyboard,,,`;

  return (
    <div className="grid gap-6">
      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Importador CSV</h1>
            <p className="text-sm text-[color:var(--text-secondary)] max-w-2xl">
              Sube el archivo exportado desde el Excel actual. Detectamos clientes, proyectos, invoices, pagos, gastos y ajustes.
            </p>
          </div>
          <div className="tag">Tipos: client, project, invoice, payment, expense, adjustment</div>
        </div>
        <label className="surface-muted mt-6 grid cursor-pointer gap-3 rounded-2xl border border-dashed border-emerald-400/60 p-6 text-center text-sm text-[color:var(--text-secondary)]">
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <span className="text-lg font-semibold text-emerald-600">Seleccionar archivo CSV</span>
          <span>
            El archivo debe incluir una columna <code className="rounded bg-[color:var(--surface)] px-1">type</code> para mapear cada fila.
          </span>
        </label>
        {feedback && (
          <div className="surface-strong mt-4 border-emerald-400/60 text-sm text-[color:var(--text-secondary)]">
            {feedback}
          </div>
        )}
      </section>

      <section className="surface">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Formato de ejemplo</h2>
        <pre className="mt-4 whitespace-pre-wrap break-all rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4 text-left text-xs text-[color:var(--text-secondary)]">
{sample}
        </pre>
        <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
          Las columnas adicionales (como comentarios) se transforman automáticamente en notas o ajustes durante la importación.
        </p>
      </section>
    </div>
  );
}
