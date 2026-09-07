import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { JsonLd } from "@/components/json-ld";
import {
  resumirFicha,
  type CasoFicha,
  type IndicadorFicha,
} from "@/lib/ficha";
import { SITE_URL, absoluto } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Políticos monitorados",
  description:
    "Histórico contextualizado de políticos brasileiros: casos, contradições e posições documentados ao longo do tempo com fontes públicas e de imprensa.",
  alternates: { canonical: "/politicos" },
};

type Politico = {
  id: number;
  nome: string;
  partido: string | null;
  cargo: string | null;
  biografia: string | null;
  foto_url: string | null;
  termos_busca: string[] | null;
};

type PoliticoComFicha = Politico & {
  ficha?: { total: number; indicador: IndicadorFicha };
};

function rotuloFicha(indicador: IndicadorFicha, total: number): string {
  if (indicador === "sem_casos") return "Ficha limpa";
  if (total === 1) return "1 caso documentado";
  return `${total} casos documentados`;
}

function classesBadgeFicha(indicador: IndicadorFicha): string {
  switch (indicador) {
    case "sem_casos":
      return "bg-success/10 text-success";
    case "atencao":
      return "bg-accent/10 text-accent";
    default:
      return "bg-aviso/10 text-aviso";
  }
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return (
    partes
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default async function PoliticosPage() {
  const { data } = await supabase()
    .from("politicos")
    .select("id, nome, partido, cargo, biografia, foto_url, termos_busca, criado_em")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  const politicosBase = (data as Politico[]) ?? [];
  let politicos: PoliticoComFicha[] = politicosBase;

  if (politicosBase.length > 0) {
    const ids = politicosBase.map((p) => p.id);
    const { data: casos } = await supabase()
      .from("ficha_politico")
      .select("*")
      .in("politico_id", ids);

    const fichas = new Map<number, CasoFicha[]>();
    for (const caso of (casos ?? []) as CasoFicha[]) {
      if (!fichas.has(caso.politico_id)) fichas.set(caso.politico_id, []);
      fichas.get(caso.politico_id)!.push(caso);
    }

    politicos = politicosBase.map((p) => ({
      ...p,
      ficha: resumirFicha(fichas.get(p.id) ?? []),
    }));
  }

  return (
    <div className="min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          url: absoluto("/politicos"),
          itemListElement: politicos.map((p, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Person",
              name: p.nome,
              url: absoluto(`/politicos/${p.id}`),
              image: p.foto_url
                ? absoluto(p.foto_url)
                : `${SITE_URL}/opengraph-image`,
              jobTitle: p.cargo ?? undefined,
              affiliation: p.partido
                ? { "@type": "Organization", name: p.partido }
                : undefined,
            },
          })),
        }}
      />
      <main className="container-page py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary dark:text-primary-light">
          Políticos monitorados
        </h1>
        <p className="mt-2 text-neutral-dark/70 dark:text-neutral-300">
          Histórico contextualizado com casos, contradições e posições documentados ao
          longo do tempo.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {politicos.map((p) => (
            <article
              key={p.id}
              className="card p-6 transition-shadow hover:shadow-glow"
            >
              <Link href={`/politicos/${p.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {p.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.foto_url}
                        alt={`Foto de ${p.nome}`}
                        className="h-16 w-16 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary dark:bg-primary/20 dark:text-primary-light">
                        {iniciais(p.nome)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-primary dark:text-primary-light">{p.nome}</h2>
                      <p className="mt-1 text-sm text-neutral-dark/70 dark:text-neutral-300">
                        {p.partido}
                        {p.cargo ? ` · ${p.cargo}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="chip bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                      {p.partido ?? "Sem partido"}
                    </span>
                    {p.ficha && p.ficha.total > 0 && (
                      <span
                        className={`chip ${classesBadgeFicha(p.ficha.indicador)}`}
                        title="Casos documentados por fontes públicas"
                      >
                        {rotuloFicha(p.ficha.indicador, p.ficha.total)}
                      </span>
                    )}
                  </div>
                </div>

                {p.biografia && (
                  <p className="mt-3 text-sm text-neutral-dark/70 dark:text-neutral-300">{p.biografia}</p>
                )}

                {p.termos_busca && p.termos_busca.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.termos_busca.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-neutral-dark/5 px-2.5 py-0.5 text-xs text-neutral-dark/80 dark:bg-white/10 dark:text-neutral-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>

              <div className="mt-4 flex items-center gap-4 text-sm font-medium">
                <span className="text-accent hover:underline dark:text-accent-light">Ver perfil →</span>
                <Link
                  href={`/noticias?q=${encodeURIComponent(p.nome)}`}
                  className="text-neutral-dark/60 hover:text-primary hover:underline dark:text-neutral-400 dark:hover:text-primary-light"
                >
                  Ver notícias →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {politicos.length === 0 && (
          <div className="mt-8 flex items-center justify-center rounded-xl border border-dashed border-neutral-dark/20 bg-white py-16 dark:border-white/15 dark:bg-neutral-panel">
            <p className="text-neutral-dark/60 dark:text-neutral-400">
              Nenhum político ativo no momento.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}