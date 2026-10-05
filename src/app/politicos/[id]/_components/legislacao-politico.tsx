"use client";

import { useState } from "react";
import type {
  AutoriaAgente,
  VotacaoPorAgente,
} from "@/types/legislativo";
import { VOTO_ROTULOS_PT } from "@/lib/legislativo";

type Tab = "autoria" | "votacoes";

export function LegislacaoPolitico({
  autorias,
  votacoes,
}: {
  autorias: AutoriaAgente[];
  votacoes: VotacaoPorAgente[];
}) {
  const [tab, setTab] = useState<Tab>("autoria");

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold text-primary dark:text-primary-light">
        Atividade Legislativa
      </h2>
      <p className="mt-1 text-sm text-neutral-dark/60 dark:text-neutral-400">
        Dados brutos oficiais (Câmara dos Deputados/Senado). Sem juízo de valor.
      </p>

      <div className="mt-4 flex gap-2 border-b border-neutral-dark/10 dark:border-white/10">
        {(
          [
            ["autoria", "Autoria"],
            ["votacoes", "Votações"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t as Tab)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-primary text-primary dark:border-primary-light dark:text-primary-light"
                : "text-neutral-dark/60 hover:text-neutral-dark dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "autoria" && (
        <div className="mt-4 overflow-x-auto">
          {autorias.length === 0 ? (
            <p className="text-sm text-neutral-dark/60 dark:text-neutral-400">
              Nenhuma autoria encontrada para este agente político.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-neutral-dark/10 text-sm dark:divide-white/10">
              <thead className="bg-neutral-50 dark:bg-neutral-900/40">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Proposição</th>
                  <th className="px-3 py-2 text-left font-medium">Papel</th>
                  <th className="px-3 py-2 text-left font-medium">Situação</th>
                  <th className="px-3 py-2 text-left font-medium">Apresentação</th>
                  <th className="px-3 py-2 text-left font-medium">Fonte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-dark/10 dark:divide-white/10">
                {autorias.map((a, idx) => {
                  const sigla = `${a.tipo} ${a.numero}/${a.ano}`;
                  return (
                    <tr key={`${a.proposicao_id}-${idx}`}>
                      <td className="max-w-xs px-3 py-2">
                        <div className="font-medium">{sigla}</div>
                        {a.ementa && (
                          <p className="mt-1 line-clamp-2 text-xs text-neutral-dark/60 dark:text-neutral-400">
                            {a.ementa}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 capitalize">{a.papel}</td>
                      <td className="px-3 py-2">{a.situacao ?? "—"}</td>
                      <td className="px-3 py-2">
                        {a.data_apresentacao
                          ? new Date(a.data_apresentacao).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {a.url_oficial ? (
                          <a
                            href={a.url_oficial}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline underline-offset-4 dark:text-primary-light"
                          >
                            Oficial
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "votacoes" && (
        <div className="mt-4 overflow-x-auto">
          {votacoes.length === 0 ? (
            <p className="text-sm text-neutral-dark/60 dark:text-neutral-400">
              Nenhum registro de votação encontrado para este agente político.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-neutral-dark/10 text-sm dark:divide-white/10">
              <thead className="bg-neutral-50 dark:bg-neutral-900/40">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Data/Hora</th>
                  <th className="px-3 py-2 text-left font-medium">Votação</th>
                  <th className="px-3 py-2 text-left font-medium">Posicionamento</th>
                  <th className="px-3 py-2 text-left font-medium">Aprovada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-dark/10 dark:divide-white/10">
                {votacoes.map((v, idx) => {
                  const sigla = v.tipo && v.numero && v.ano ? `${v.tipo} ${v.numero}/${v.ano}` : null;
                  return (
                    <tr key={`${v.votacao_id}-${idx}`}>
                      <td className="whitespace-nowrap px-3 py-2">
                        {v.data_hora ? new Date(v.data_hora).toLocaleString("pt-BR") : "—"}
                      </td>
                      <td className="max-w-md px-3 py-2">
                        <div className="font-medium">{sigla ?? "—"}</div>
                        {v.objeto_votacao && (
                          <p className="mt-1 line-clamp-2 text-xs text-neutral-dark/60 dark:text-neutral-400">
                            {v.objeto_votacao}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-medium">{VOTO_ROTULOS_PT[v.voto]}</span>
                        {v.voto_original && (
                          <span className="ml-2 text-xs text-neutral-dark/50 dark:text-neutral-400">
                            ({v.voto_original})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {v.aprovada === null ? "—" : v.aprovada ? "Sim" : "Não"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
