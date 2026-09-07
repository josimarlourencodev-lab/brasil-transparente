import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { JsonLd } from "@/components/json-ld";
import {
  rotuloStatusCaso,
  rotuloTipoCaso,
  type CasoFicha,
} from "@/lib/ficha";
import { SITE_URL, absoluto } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Politico = {
  id: number;
  nome: string;
  partido: string | null;
  cargo: string | null;
  biografia: string | null;
  foto_url: string | null;
  termos_busca: string[] | null;
  criado_em: string;
  atualizado_em: string;
};

type Noticia = {
  id: number;
  titulo: string;
  url: string;
  resumo: string | null;
  categoria: string;
  tipo_fonte: string;
  publicado_em: string | null;
  imagem_url: string | null;
};

type Perfil = {
  politico: Politico;
  noticias: Noticia[];
  ficha: CasoFicha[];
};

const buscarPerfil = cache(async (id: number): Promise<Perfil | null> => {
  const { data: politico } = await supabase()
    .from("politicos")
    .select("id, nome, partido, cargo, biografia, foto_url, termos_busca, criado_em, atualizado_em")
    .eq("ativo", true)
    .eq("id", id)
    .single();

  if (!politico) return null;

  const [{ data: noticias }, { data: ficha }] = await Promise.all([
    supabase()
      .from("noticias")
      .select("id, titulo, url, resumo, categoria, tipo_fonte, publicado_em, imagem_url")
      .eq("status", "publicado")
      .or(
        `politico_id.eq.${id},titulo.ilike.%${politico.nome}%,resumo.ilike.%${politico.nome}%`
      )
      .order("publicado_em", { ascending: false })
      .limit(50),
    supabase().from("ficha_politico").select("*").eq("politico_id", id),
  ]);

  return {
    politico,
    noticias: (noticias as Noticia[]) ?? [],
    ficha: (ficha as CasoFicha[]) ?? [],
  };
});

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return {};

  const perfil = await buscarPerfil(id);
  if (!perfil) {
    return { title: "Político não encontrado", robots: { index: false } };
  }

  const { politico } = perfil;
  const descricao =
    politico.biografia ??
    `Histórico, casos documentados e notícias sobre ${politico.nome}.`;
  const imagemAbsoluta = politico.foto_url
    ? absoluto(politico.foto_url)
    : `${SITE_URL}/opengraph-image`;

  return {
    title: politico.nome,
    description: descricao.slice(0, 160),
    alternates: { canonical: `/politicos/${id}` },
    keywords: politico.termos_busca ?? [],
    openGraph: {
      type: "profile",
      url: absoluto(`/politicos/${id}`),
      title: `${politico.nome} — ${politico.partido ?? "política brasileira"}`,
      description: descricao.slice(0, 160),
      images: [{ url: imagemAbsoluta }],
    },
    twitter: {
      card: "summary_large_image",
      title: politico.nome,
      description: descricao.slice(0, 160),
      images: [imagemAbsoluta],
    },
  };
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

export default async function PoliticoDetailPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const perfil = await buscarPerfil(id);
  if (!perfil) notFound();

  const { politico, noticias, ficha } = perfil;
  const urlPagina = absoluto(`/politicos/${id}`);

  return (
    <div className="min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              "@id": urlPagina,
              name: politico.nome,
              url: urlPagina,
              image: politico.foto_url ? absoluto(politico.foto_url) : undefined,
              description: politico.biografia ?? undefined,
              jobTitle: politico.cargo ?? undefined,
              affiliation: politico.partido
                ? { "@type": "Organization", name: politico.partido }
                : undefined,
              knowsAbout: politico.termos_busca ?? undefined,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Políticos", item: `${SITE_URL}/politicos` },
                { "@type": "ListItem", position: 3, name: politico.nome, item: urlPagina },
              ],
            },
          ],
        }}
      />
      <main className="container-page py-12">
        <Link
          href="/politicos"
          className="text-sm text-neutral-dark/60 transition hover:text-accent dark:text-neutral-400 dark:hover:text-accent-light"
        >
          ← Todos os políticos
        </Link>

        <div className="card mt-6 flex flex-col gap-6 p-8 sm:flex-row sm:items-start">
          {politico.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={politico.foto_url}
              alt={`Foto de ${politico.nome}`}
              className="h-40 w-40 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary/10 text-5xl font-bold text-primary dark:bg-primary/20 dark:text-primary-light">
              {iniciais(politico.nome)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-primary dark:text-primary-light">{politico.nome}</h1>
            <p className="mt-2 text-neutral-dark/70 dark:text-neutral-300">
              {politico.partido ?? "Sem partido"}
              {politico.cargo ? ` · ${politico.cargo}` : ""}
            </p>
            {politico.biografia && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-dark/80 dark:text-neutral-300">
                {politico.biografia}
              </p>
            )}
            {politico.termos_busca && politico.termos_busca.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {politico.termos_busca.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-neutral-dark/5 px-2.5 py-0.5 text-xs text-neutral-dark/80 dark:bg-white/10 dark:text-neutral-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="prose-title mt-10">Ficha</h2>
        {ficha.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-dark/60 dark:text-neutral-400">
            Nenhum caso documentado por fontes públicas até o momento.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-neutral-dark/60 dark:text-neutral-400">
              Casos documentados a partir de fontes públicas e veículos de
              imprensa.
            </p>
            <div className="mt-6 space-y-4">
              {ficha.map((c) => (
                <article
                  key={c.id}
                  className="card flex flex-col gap-3 p-6"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-dark/60 dark:text-neutral-400">
                    <span className="chip bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                      {rotuloTipoCaso(c.tipo)}
                    </span>
                    <span className="chip bg-neutral-dark/5 text-neutral-dark/80 dark:bg-white/10 dark:text-neutral-300">
                      {rotuloStatusCaso(c.status)}
                    </span>
                    {c.orgao && (
                      <span>{c.orgao}</span>
                    )}
                    {c.data_fato && (
                      <time dateTime={c.data_fato}>
                        {new Date(c.data_fato).toLocaleDateString("pt-BR")}
                      </time>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-primary dark:text-neutral-100">
                    {c.titulo}
                  </h3>
                  {c.descricao && (
                    <p className="text-sm leading-relaxed text-neutral-dark/70 dark:text-neutral-300">
                      {c.descricao}
                    </p>
                  )}
                  {c.fontes && c.fontes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {c.fontes.map((u, i) => (
                        <a
                          key={`${u}-${i}`}
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-accent hover:underline dark:text-accent-light"
                        >
                          Fonte {c.fontes.length > 1 ? i + 1 : ""} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}

        <h2 className="prose-title mt-10">
          Notícias relacionadas
        </h2>
        <p className="mt-1 text-sm text-neutral-dark/60 dark:text-neutral-400">
          {noticias.length > 0
            ? `Matérias em que ${politico.nome} é mencionado.`
            : "Nenhuma notícia associada ainda."}
        </p>

        <div className="mt-6 space-y-4">
          {noticias.map((n) => (
            <article
              key={n.id}
              className="card flex flex-col gap-5 p-6 transition hover:shadow-glow sm:flex-row"
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
                    {n.publicado_em && (
                      <time dateTime={n.publicado_em}>
                        {new Date(n.publicado_em).toLocaleDateString("pt-BR")}
                      </time>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold transition hover:text-primary dark:text-neutral-100 dark:hover:text-primary-light">
                    {n.titulo}
                  </h3>
                  {n.resumo && (
                    <p className="mt-2 text-sm text-neutral-dark/70 dark:text-neutral-300">{n.resumo}</p>
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
        </div>
      </main>
    </div>
  );
}