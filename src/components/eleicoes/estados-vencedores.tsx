"use client";

import type { ResultadoPorEstado } from "@/lib/tse";

const CORES = [
  "#0e7490",
  "#c2410c",
  "#a16207",
  "#7c3aed",
  "#be185d",
  "#3f6212",
  "#3730a3",
];

export function EstadosVencedores({
  estados,
  acessivel,
}: {
  estados: ResultadoPorEstado[];
  acessivel: boolean;
}) {
  if (!acessivel) {
    return (
      <p className="py-10 text-center text-sm text-neutral-dark/60 dark:text-neutral-400">
        Os dados por estado ainda não estão disponíveis.
      </p>
    );
  }

  const vencedores = estados
    .map((e) => e.votante_maioria?.numero)
    .filter((n): n is number => n !== undefined && n !== null);
  const coresPorNumero = new Map<number, string>();
  let i = 0;
  for (const n of new Set(vencedores)) {
    coresPorNumero.set(n, CORES[i % CORES.length]);
    i += 1;
  }

  const legenda = [
    ...estados
      .map((e) => e.votante_maioria)
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .reduce((acc, c) => acc.set(c.numero, c), new Map<number, NonNullable<ResultadoPorEstado["votante_maioria"]>>())
      .values(),
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {estados.map((e) => {
          const vencedor = e.votante_maioria;
          const cor = vencedor ? coresPorNumero.get(vencedor.numero) : "#475569";
          const pct =
            vencedor && vencedor.pct_votos_validos !== null
              ? `${vencedor.pct_votos_validos.toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })}%`
              : "—";
          return (
            <div
              key={e.uf}
              className="flex flex-col rounded-xl border border-neutral-dark/10 p-3 dark:border-white/10"
              style={{ borderLeftWidth: 4, borderLeftColor: cor }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-dark/60 dark:text-neutral-400">
                {e.uf.toUpperCase()}
              </span>
              <span className="mt-1 truncate text-sm font-semibold text-neutral-dark dark:text-neutral-100">
                {vencedor ? vencedor.nome_urna : "—"}
              </span>
              <span className="mt-0.5 text-xs text-neutral-dark/50 dark:text-neutral-400">
                {vencedor
                  ? `${vencedor.partido} · ${pct} (${vencedor.votos.toLocaleString("pt-BR")})`
                  : e.uf_nome}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
        {legenda.map((c) => {
          const cor = coresPorNumero.get(c.numero);
          return (
            <span key={c.numero} className="flex items-center gap-1.5 text-xs text-neutral-dark/70 dark:text-neutral-300">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cor }} />
              {c.nome_urna} · {c.partido}
            </span>
          );
        })}
      </div>
    </div>
  );
}