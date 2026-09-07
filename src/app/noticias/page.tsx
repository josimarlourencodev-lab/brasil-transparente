import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { JsonLd } from "@/components/json-ld";
import { NoticiasSearch } from "@/components/noticias-search";
import { absoluto } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Politica = {
  id: number;
  nome: string;
};

type Noticia = {
  id: number;
  titulo: string;
  resumo: string | null;
  categoria: string;
  tipo_fonte: string;
  publicado_em: string | null;
  url: string;
  imagem_url: string | null;
  politica: Politica | null;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const termo = q?.trim();
  return {
    title: termo ? `Busca: ${termo}` : "Notícias monitoradas",
    description: termo
      ? `Resultados da busca por "${termo}" no monitoramento político do Brasil Transparente.`
      : "Matérias coletadas de fontes oficiais e de oposição, com referências primárias.",
    alternates: {
      canonical: termo
        ? `/noticias?q=${encodeURIComponent(termo)}`
        : "/noticias",
    },
    robots: termo ? { index: false, follow: true } : undefined,
  };
}

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const termo = q?.trim() ?? "";

  let query = supabase()
    .from("noticias")
    .select(
      "id, titulo, resumo, categoria, tipo_fonte, publicado_em, url, imagem_url, politica:politicos(id, nome)"
    )
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .limit(100);

  if (termo) {
    const seguro = termo.replace(/%/g, "\\%");
    query = query.or(
      `titulo.ilike.%${seguro}%,resumo.ilike.%${seguro}%,metadata->>envolvidos.ilike.%${seguro}%`
    );
  }

  const { data } = await query;
  const noticias = (data as unknown as Noticia[]) ?? [];

  return (
    <div className="min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          url: absoluto("/noticias"),
          itemListElement: noticias.slice(0, 50).map((n, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "NewsArticle",
              headline: n.titulo,
              url: absoluto(`/noticias/${n.id}`),
              description: n.resumo ?? undefined,
              image: n.imagem_url ? absoluto(n.imagem_url) : undefined,
            },
          })),
        }}
      />
      <main className="container-page py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary dark:text-primary-light">
          Notícias monitoradas
        </h1>
        <p className="mt-2 text-neutral-dark/70 dark:text-neutral-300">
          Matérias coletadas de fontes oficiais e de oposição, com referências primárias.
        </p>

        <Suspense fallback={null}>
          <NoticiasSearch />
        </Suspense>

        {termo && (
          <p className="mt-3 text-sm text-neutral-dark/60 dark:text-neutral-400">
            Resultados para <strong className="text-primary dark:text-primary-light">{termo}</strong>
            {noticias.length > 0 ? ` (${noticias.length})` : ""}
          </p>
        )}

        <div className="mt-8 grid gap-4">
          {noticias.map((n) => (
            <article
              key={n.id}
              className="card flex flex-col gap-3 p-6 transition hover:shadow-glow sm:flex-row"
            >
              <Link
                href={`/noticias/${n.id}`}
                className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row"
              >
                {n.imagem_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.imagem_url}
                    alt=""
                    className="h-32 w-full shrink-0 rounded-lg object-cover sm:h-28 sm:w-40"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-dark/60 dark:text-neutral-400">
                    <span className="chip bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                      {n.categoria}
                    </span>
                    <span>{n.tipo_fonte}</span>
                    {n.politica && (
                      <span className="chip bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light">
                        {n.politica.nome}
                      </span>
                    )}
                    {n.publicado_em && (
                      <time dateTime={n.publicado_em}>
                        {new Date(n.publicado_em).toLocaleDateString("pt-BR")}
                      </time>
                    )}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold transition hover:text-primary dark:text-neutral-100 dark:hover:text-primary-light">
                    {n.titulo}
                  </h2>
                  {n.resumo && (
                    <p className="mt-2 text-sm text-neutral-dark/70 dark:text-neutral-300">
                      {n.resumo}
                    </p>
                  )}
                  <span className="mt-3 inline-flex text-xs font-semibold text-accent hover:underline">
                    Ler no site →
                  </span>
                </div>
              </Link>
              {n.url && (
                <div className="shrink-0 sm:self-center">
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost whitespace-nowrap px-3 py-2 text-xs"
                  >
                    Fonte original ↗
                  </a>
                </div>
              )}
            </article>
          ))}

          {noticias.length === 0 && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-neutral-dark/20 bg-white py-16 dark:border-white/15 dark:bg-neutral-panel">
              <p className="text-neutral-dark/60 dark:text-neutral-400">
                {termo ? "Nenhuma notícia encontrada para esta busca." : "Ainda não há notícias coletadas."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}