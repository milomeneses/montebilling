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
      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold">Importador CSV</h1>
        <p className="text-sm text-slate-300">
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

  const sample = `type,client,project,amount,currency,date,notes,from,to,category,invoice,status
client,Winston Media,,,,,,,
project,Winston Media,Campaña Winston,45000,USD,2024-01-02,Spot global,,,
invoice,,Campaña Winston,18150,USD,2024-02-10,Primer milestone,,,
payment,,,,18150,USD,2024-03-01,,transfer,,,
adjustment,,,537,USD,2024-03-05,Reintegro,Sergio,Milo,Reintegro,
expense,,Campaña Winston,1200,USD,2024-03-04,Storyboard,,,
`;

  return (
    <div className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Importador CSV</h1>
          <p className="text-sm text-slate-300">
            Sube el archivo exportado desde el Excel actual. Detectamos clientes, proyectos, invoices, pagos, gastos y ajustes.
          </p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
          Tipos: client, project, invoice, payment, expense, adjustment
        </span>
      </div>

      <label className="grid gap-2 rounded-2xl border border-dashed border-emerald-500/40 bg-slate-950/40 p-6 text-center text-sm text-slate-300">
        <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <span className="text-lg font-semibold text-emerald-300">Seleccionar archivo CSV</span>
        <span className="text-xs text-slate-500">
          El archivo debe incluir una columna <code className="rounded bg-slate-800 px-1">type</code> para mapear cada fila.
        </span>
      </label>

      {feedback && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {feedback}
        </div>
      )}

      <section className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-300">
        <h2 className="text-sm font-semibold text-slate-100">Formato de ejemplo</h2>
        <pre className="whitespace-pre-wrap break-all rounded-xl bg-slate-950/60 p-4 text-left text-[11px] text-slate-300">
{sample}
        </pre>
        <p className="text-slate-400">
          Las columnas adicionales (como comentarios) se transforman automáticamente en notas o ajustes durante la importación.
        </p>
      </section>
    </div>
  );
}
