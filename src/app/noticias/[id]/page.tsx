import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { JsonLd } from "@/components/json-ld";
import { SITE_NAME, SITE_URL, absoluto } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Politico = {
  id: number;
  nome: string;
  partido: string | null;
  foto_url: string | null;
};

type Noticia = {
  id: number;
  titulo: string;
  url: string;
  url_fonte: string | null;
  resumo: string | null;
  categoria: string;
  tipo_fonte: string;
  publicado_em: string | null;
  coletado_em: string | null;
  imagem_url: string | null;
  contradicao_detectada: boolean;
  contradicao_descricao: string | null;
  politico: Politico | null;
};

const buscarNoticia = cache(async (id: number): Promise<Noticia | null> => {
  const { data } = await supabase()
    .from("noticias")
    .select(
      "id, titulo, url, url_fonte, resumo, categoria, tipo_fonte, publicado_em, coletado_em, imagem_url, contradicao_detectada, contradicao_descricao, politico:politicos(id, nome, partido, foto_url)"
    )
    .eq("id", id)
    .eq("status", "publicado")
    .single();

  return (data as unknown as Noticia | undefined) ?? null;
});

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return {};

  const noticia = await buscarNoticia(id);
  if (!noticia) {
    return { title: "Notícia não encontrada", robots: { index: false } };
  }

  const descricao = noticia.resumo?.slice(0, 160) ?? noticia.titulo;
  const imagemAbsoluta = noticia.imagem_url
    ? absoluto(noticia.imagem_url)
    : `${SITE_URL}/opengraph-image`;

  return {
    title: noticia.titulo,
    description: descricao,
    alternates: { canonical: `/noticias/${id}` },
    openGraph: {
      type: "article",
      url: absoluto(`/noticias/${id}`),
      title: noticia.titulo,
      description: descricao,
      publishedTime: noticia.publicado_em ?? undefined,
      modifiedTime: noticia.coletado_em ?? noticia.publicado_em ?? undefined,
      authors: noticia.politico ? [noticia.politico.nome] : [],
      section: noticia.categoria,
      images: [{ url: imagemAbsoluta }],
    },
    twitter: {
      card: "summary_large_image",
      title: noticia.titulo,
      description: descricao,
      images: [imagemAbsoluta],
    },
  };
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function NoticiaDetailPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const noticia = await buscarNoticia(id);
  if (!noticia) notFound();

  const urlPagina = absoluto(`/noticias/${id}`);
  const pesquisa = absoluto(`/noticias?q=${encodeURIComponent(noticia.titulo)}`);

  return (
    <div className="min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "NewsArticle",
              mainEntityOfPage: { "@type": "WebPage", "@id": urlPagina },
              headline: noticia.titulo,
              description: noticia.resumo ?? undefined,
              image: noticia.imagem_url ? absoluto(noticia.imagem_url) : `${SITE_URL}/opengraph-image`,
              datePublished: noticia.publicado_em ?? undefined,
              dateModified: noticia.coletado_em ?? noticia.publicado_em ?? undefined,
              author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
              publisher: { "@id": `${SITE_URL}/#organizacao` },
              isAccessibleForFree: true,
              articleSection: noticia.categoria,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Notícias", item: `${SITE_URL}/noticias` },
                { "@type": "ListItem", position: 3, name: noticia.titulo, item: urlPagina },
              ],
            },
            {
              "@type": "WebPage",
              "@id": urlPagina,
              url: urlPagina,
              isPartOf: { "@id": `${SITE_URL}/#site` },
              about: noticia.politico ? noticia.politico.nome : noticia.categoria,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: pesquisa,
                },
              },
            },
          ],
        }}
      />
      <main className="container-page py-12">
        <Link
          href="/noticias"
          className="text-sm text-neutral-dark/60 transition hover:text-accent dark:text-neutral-400 dark:hover:text-accent-light"
        >
          ← Todas as notícias
        </Link>

        <article className="mt-6">
          {noticia.imagem_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={noticia.imagem_url}
              alt=""
              className="mb-8 h-56 w-full rounded-2xl object-cover sm:h-72"
            />
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-dark/60 dark:text-neutral-400">
            <span className="chip bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
              {noticia.categoria}
            </span>
            <span>{noticia.tipo_fonte}</span>
            {noticia.publicado_em && (
              <time dateTime={noticia.publicado_em} itemProp="datePublished">
                Publicado em {formatarData(noticia.publicado_em)}
              </time>
            )}
          </div>

          <h1 className="prose-title mt-4">{noticia.titulo}</h1>

          {noticia.politico && (
            <Link
              href={`/politicos/${noticia.politico.id}`}
              className="mt-4 inline-flex items-center gap-3 rounded-xl border border-neutral-dark/10 bg-white p-3 text-sm font-medium text-primary shadow-soft transition hover:border-primary/40 dark:border-white/10 dark:bg-neutral-panel dark:text-primary-light dark:hover:border-primary-light/40"
            >
              {noticia.politico.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={noticia.politico.foto_url}
                  alt={`Foto de ${noticia.politico.nome}`}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                  {noticia.politico.nome.charAt(0).toUpperCase()}
                </span>
              )}
              {noticia.politico.nome}
              {noticia.politico.partido
                ? ` · ${noticia.politico.partido}`
                : ""}
            </Link>
          )}

          <div className="mt-6 space-y-6">
            {noticia.resumo ? (
              <section className="card p-8">
                <h2 className="font-display text-xl font-bold text-primary dark:text-primary-light">
                  Leitura no site
                </h2>
                <p className="prose mt-4 leading-relaxed text-neutral-dark/90 dark:text-neutral-200">
                  {noticia.resumo}
                </p>
              </section>
            ) : (
              <section className="card p-8">
                <h2 className="font-display text-xl font-bold text-primary dark:text-primary-light">
                  Resumo em preparação
                </h2>
                <p className="mt-2 text-sm text-neutral-dark/70 dark:text-neutral-300">
                  Nossa equipe ainda não concluiu a síntese desta matéria.
                  Leia a versão original na fonte abaixo.
                </p>
              </section>
            )}

            {noticia.contradicao_detectada && noticia.contradicao_descricao && (
              <section className="rounded-xl border border-accent/40 bg-accent/5 p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-accent dark:text-accent-light">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full bg-accent"
                  />
                  Contraposição encontrada
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-dark/90 dark:text-neutral-200">
                  {noticia.contradicao_descricao}
                </p>
              </section>
            )}

            {noticia.url && (
              <section className="rounded-xl border border-neutral-dark/10 bg-white p-6 dark:border-white/10 dark:bg-neutral-panel">
                <h2 className="font-display text-base font-bold text-primary dark:text-primary-light">
                  Fonte original
                </h2>
                <p className="mt-1 text-xs text-neutral-dark/60 dark:text-neutral-400">
                  Conteúdo monitorado por nossa equipe, sem edição.
                </p>
                <a
                  href={noticia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-4 inline-flex items-center gap-2"
                >
                  Abrir matéria original
                </a>
                <p className="mt-3 break-all text-xs text-neutral-dark/50 dark:text-neutral-500">
                  {noticia.url_fonte ?? noticia.url}
                </p>
              </section>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}