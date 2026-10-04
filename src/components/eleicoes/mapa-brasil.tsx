"use client";

import { DIMENSOES_MAPA, PATHS_ESTADOS } from "./dados-mapa";
import type { ResultadoPorEstado } from "@/lib/tse";

export function MapaBrasil({
  estados,
  acessivel,
}: {
  estados: ResultadoPorEstado[];
  acessivel: boolean;
}) {
  const CORES = [
    "#0e7490",
    "#c2410c",
    "#a16207",
    "#7c3aed",
    "#be185d",
    "#3f6212",
    "#3730a3",
  ];

  if (!acessivel) {
    return (
      <p className="py-10 text-center text-sm text-neutral-dark/60 dark:text-neutral-400">
        Os dados por estado ainda não estão disponíveis.
      </p>
    );
  }

  const porUF = new Map(estados.map((e) => [e.uf, e]));

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
      .reduce(
        (acc, c) => acc.set(c.numero, c),
        new Map<number, NonNullable<ResultadoPorEstado["votante_maioria"]>>()
      )
      .values(),
  ];

  return (
    <div>
      <svg
        viewBox={`0 0 ${DIMENSOES_MAPA.largura} ${DIMENSOES_MAPA.altura}`}
        role="img"
        aria-label="Mapa do Brasil com o candidato que lidera em cada estado"
        className="mx-auto h-auto w-full max-w-2xl"
      >
        <title>Onde cada candidato lidera por estado</title>
        {PATHS_ESTADOS.map(({ uf, nome, d }) => {
          const estado = porUF.get(uf);
          const vencedor = estado?.votante_maioria;
          const cor = vencedor ? coresPorNumero.get(vencedor.numero) : "#475569";
          const pct =
            vencedor && vencedor.pct_votos_validos !== null
              ? `${vencedor.pct_votos_validos.toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })}%`
              : "—";
          return (
            <path
              key={uf}
              d={d}
              fill={cor}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={1}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              <title>
                {nome} — {vencedor ? vencedor.nome_urna : "sem dados"} · {pct}
              </title>
            </path>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
        {legenda.map((c) => {
          const cor = coresPorNumero.get(c.numero);
          return (
            <span
              key={c.numero}
              className="flex items-center gap-1.5 text-xs text-neutral-dark/70 dark:text-neutral-300"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: cor }}
              />
              {c.nome_urna} · {c.partido}
            </span>
          );
        })}
      </div>
    </div>
  );
}