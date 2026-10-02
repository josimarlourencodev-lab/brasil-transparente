import type { Metadata } from "next";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import PercentIcon from "@mui/icons-material/Percent";
import HowlIcon from "@mui/icons-material/GraphicEq";
import { consultarResultadoPresidencial } from "@/lib/tse";
import { JsonLd } from "@/components/json-ld";
import { absoluto, SITE_NAME } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eleições 2026 — Apuração em tempo real",
  description:
    "Acompanhe a totalização oficial do TSE para a Presidência da República nas Eleições 2026: percentual apurado, votos válidos, brancos e nulos, e ranking dos candidatos.",
  alternates: { canonical: "/eleicoes" },
};

const DISCLAIMER =
  "Dados oficiais do TSE (Portal Resultados), atualizados automaticamente durante a totalização. 1º turno: 04/10/2026, divulgação a partir das 17h (horário de Brasília).";

function cortar(n: number): string {
  if (n === 0) return "0";
  return n.toLocaleString("pt-BR");
}

function formatarData(geradoEm: string | null): string {
  if (!geradoEm) return "—";
  const [data, hora] = geradoEm.split(" ");
  return `${data} às ${hora ?? ""}`;
}

export default async function EleicoesPage() {
  let resultado: Awaited<ReturnType<typeof consultarResultadoPresidencial>> =
    null;
  let erro = false;
  try {
    resultado = await consultarResultadoPresidencial();
  } catch {
    erro = true;
  }

  return (
    <div className="min-h-screen">
      {resultado && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Eleições 2026 — Apuração em tempo real",
            url: absoluto("/eleicoes"),
            isPartOf: { "@type": "WebSite", name: SITE_NAME },
          }}
        />
      )}
      <section className="relative overflow-hidden bg-primary dark:bg-neutral-night">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
          style={{
            background:
              "radial-gradient(circle at 20% 0%, transparent 0, transparent 30%, #fff 45%, transparent 46%), radial-gradient(circle at 80% 100%, transparent 0, transparent 30%, #fff 50%, transparent 51%)",
          }}
        />
        <div className="container-page relative py-16 sm:py-20">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-soft backdrop-blur-sm sm:h-24 sm:w-24">
              <HowToVoteIcon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <div className="max-w-2xl">
              <span className="chip bg-white/15 text-white">
                <PercentIcon className="h-3.5 w-3.5" />
                Totalização oficial — TSE
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Eleições 2026 · apuração em tempo real
              </h1>
              <p className="mt-3 text-base text-white/75 sm:text-lg">
                Presidência da República (1º turno) — ranking atualizado
                automaticamente a partir dos dados oficiais divulgados pelo TSE.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container-page py-12">
        {erro && (
          <div className="rounded-xl border border-dashed border-aviso/40 bg-aviso/5 p-6 text-sm text-neutral-dark/80 dark:text-neutral-300">
            Não foi possível consultar o TSE neste momento. Tente novamente em
            instantes.
          </div>
        )}

        {!erro && !resultado && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-dark/20 bg-white py-20 text-center dark:border-white/15 dark:bg-neutral-panel">
            <HowlIcon className="h-12 w-12 text-neutral-dark/30 dark:text-neutral-500" />
            <p className="mt-4 max-w-md text-neutral-dark/60 dark:text-neutral-400">
              A totalização presidencial das Eleições 2026 ainda não começou. A
              divulgação oficial do TSE abre no dia{" "}
              <strong className="text-primary dark:text-primary-light">
                04/10/2026
              </strong>{" "}
              a partir das <strong>17h</strong> (horário de Brasília).
            </p>
          </div>
        )}

        {resultado && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-neutral-dark/60 dark:text-neutral-400">
                Atualização: <strong>{formatarData(resultado.gerado_em)}</strong>
                {resultado.totalizacao_finalizada && (
                  <span className="chip ml-2 bg-success/10 text-success">
                    Apuração finalizada
                  </span>
                )}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-400">
                  Seções totalizadas
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-primary dark:text-primary-light">
                  {resultado.secao.pct !== null
                    ? `${resultado.secao.pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-neutral-dark/60 dark:text-neutral-400">
                  {cortar(resultado.secao.totalizada)} de{" "}
                  {cortar(resultado.secao.total)} seções
                </p>
              </div>
              <div className="card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-400">
                  Votos válidos
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-primary dark:text-primary-light">
                  {cortar(resultado.votos.validos)}
                </p>
                <p className="mt-1 text-xs text-neutral-dark/60 dark:text-neutral-400">
                  {resultado.votos.pct_validos !== null
                    ? `${resultado.votos.pct_validos.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total`
                    : "—"}
                </p>
              </div>
              <div className="card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-400">
                  Votos em branco
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-primary dark:text-primary-light">
                  {cortar(resultado.votos.brancos)}
                </p>
                <p className="mt-1 text-xs text-neutral-dark/60 dark:text-neutral-400">
                  {resultado.votos.total > 0 && resultado.votos.brancos > 0
                    ? `${((resultado.votos.brancos / resultado.votos.total) * 100).toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}% do total`
                    : "—"}
                </p>
              </div>
              <div className="card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-dark/50 dark:text-neutral-400">
                  Votos em nulo
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-primary dark:text-primary-light">
                  {cortar(resultado.votos.nulos)}
                </p>
                <p className="mt-1 text-xs text-neutral-dark/60 dark:text-neutral-400">
                  {resultado.votos.total > 0 && resultado.votos.nulos > 0
                    ? `${((resultado.votos.nulos / resultado.votos.total) * 100).toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}% do total`
                    : "—"}
                </p>
              </div>
            </div>

            {resultado.cargos.length > 0 && (
              <div className="card mt-8 p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-primary dark:text-primary-light">
                  Ranking — {resultado.cargos[0].nome}
                </h2>
                <div className="mt-6 space-y-4">
                  {resultado.cargos[0].candidatos
                    .filter((c) => !c.anulado)
                    .map((c, index) => {
                      const max = resultado.cargos[0].candidatos[0]?.votos ?? 1;
                      const largura =
                        max > 0 ? Math.max((c.votos / max) * 100, 2) : 0;
                      return (
                        <div key={c.sq}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="font-display font-bold text-neutral-dark/40 dark:text-neutral-500">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span className="truncate font-semibold text-neutral-dark dark:text-neutral-100">
                                {c.nome_urna}
                              </span>
                              <span className="chip hidden shrink-0 bg-neutral-dark/5 text-neutral-dark/70 dark:bg-white/10 dark:text-neutral-300 sm:inline-flex">
                                {c.partido}
                              </span>
                            </span>
                            <span className="shrink-0 text-neutral-dark/80 dark:text-neutral-300">
                              <strong>
                                {c.pct_votos_validos !== null
                                  ? `${c.pct_votos_validos.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
                                  : "—"}
                              </strong>
                              <span className="ml-2 text-xs text-neutral-dark/50 dark:text-neutral-400">
                                {cortar(c.votos)}
                              </span>
                            </span>
                          </div>
                          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-dark/10 dark:bg-white/10">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${largura}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <p className="mt-6 text-xs leading-relaxed text-neutral-dark/50 dark:text-neutral-400">
              {DISCLAIMER}
            </p>
          </>
        )}
      </main>
    </div>
  );
}