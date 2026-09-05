"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, use } from "react";
import { notFound } from "next/navigation";

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

const FALHA_LOADING = (
  <main className="container-page py-12">
    <p className="text-sm text-neutral-dark/60 dark:text-neutral-400">Carregando…</p>
  </main>
);

export function NoticiaContent({ id }: { id: number }) {
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/noticias/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error("noticia-inexistente");
        if (!r.ok) throw new Error("Falha ao carregar a notícia.");
        return r.json();
      })
      .then((data: Noticia) => {
        if (active) setNoticia(data);
      })
      .catch((e: unknown) => {
        if (active) setErro(e instanceof Error ? e.message : String(e));
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (erro === "noticia-inexistente") notFound();

  if (!noticia) {
    return (
      <main className="container-page py-12">
        <p className="text-sm text-neutral-dark/60 dark:text-neutral-400">Carregando…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
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
              <time dateTime={noticia.publicado_em}>
                Publicado em{" "}
                {new Date(noticia.publicado_em).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
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

type Props = {
  params: Promise<{ id: string }>;
};

export default function NoticiaDetailPage({ params }: Props) {
  const { id: rawId } = use(params);
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) notFound();

  return (
    <Suspense fallback={FALHA_LOADING}>
      <NoticiaContent id={id} />
    </Suspense>
  );
}