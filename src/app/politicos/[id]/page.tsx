"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, use } from "react";
import { notFound } from "next/navigation";

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
};

const FALHA_LOADING = (
  <div className="min-h-screen">
    <nav className="border-b border-neutral-dark/10 bg-white">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Brasil<span className="text-accent"> Transparente</span>
        </Link>
        <Link
          href="/noticias"
          className="text-sm text-neutral-dark/70 hover:text-primary"
        >
          Notícias
        </Link>
      </div>
    </nav>
    <main className="container-page py-12">
      <p className="text-sm text-neutral-dark/60">Carregando…</p>
    </main>
  </div>
);

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function PerfilContent({ id }: { id: number }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/politicos/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error("politico-inexistente");
        if (!r.ok) throw new Error("Falha ao carregar o perfil.");
        return r.json();
      })
      .then((data: Perfil) => {
        if (active) setPerfil(data);
      })
      .catch((e: unknown) => {
        if (active) setErro(e instanceof Error ? e.message : String(e));
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (erro === "politico-inexistente") notFound();

  if (!perfil) {
    return (
      <div className="min-h-screen">
        <nav className="border-b border-neutral-dark/10 bg-white">
          <div className="container-page flex items-center justify-between py-4">
            <Link href="/" className="text-xl font-bold tracking-tight text-primary">
              Brasil<span className="text-accent">Transparente</span>
            </Link>
            <Link
              href="/noticias"
              className="text-sm text-neutral-dark/70 hover:text-primary"
            >
              Notícias
            </Link>
          </div>
        </nav>
        <main className="container-page py-12">
          <p className="text-sm text-neutral-dark/60">Carregando…</p>
        </main>
      </div>
    );
  }

  const { politico, noticias } = perfil;

  return (
    <div className="min-h-screen">
      <nav className="border-b border-neutral-dark/10 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
            Brasil<span className="text-accent"> Transparente</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/politicos"
              className="text-sm text-neutral-dark/70 hover:text-primary"
            >
              Políticos
            </Link>
            <Link
              href="/noticias"
              className="text-sm text-neutral-dark/70 hover:text-primary"
            >
              Notícias
            </Link>
          </div>
        </div>
      </nav>

      <main className="container-page py-12">
        <Link
          href="/politicos"
          className="text-sm text-accent hover:underline"
        >
          ← Todos os políticos
        </Link>

        <div className="mt-6 flex flex-col gap-6 rounded-xl border border-neutral-dark/10 bg-white p-8 sm:flex-row">
          {politico.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={politico.foto_url}
              alt={`Foto de ${politico.nome}`}
              className="h-40 w-40 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary/10 text-5xl font-bold text-primary">
              {iniciais(politico.nome)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-primary">{politico.nome}</h1>
            <p className="mt-2 text-neutral-dark/70">
              {politico.partido ?? "Sem partido"}
              {politico.cargo ? ` · ${politico.cargo}` : ""}
            </p>
            {politico.biografia && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-dark/80">
                {politico.biografia}
              </p>
            )}
            {politico.termos_busca && politico.termos_busca.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {politico.termos_busca.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-neutral-dark/5 px-2.5 py-0.5 text-xs text-neutral-dark/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="mt-10 text-xl font-bold text-primary">
          Notícias relacionadas
        </h2>
        <p className="mt-1 text-sm text-neutral-dark/60">
          {noticias.length > 0
            ? `Matérias em que ${politico.nome} é mencionado.`
            : "Nenhuma notícia associada ainda."}
        </p>

        <div className="mt-6 space-y-4">
          {noticias.map((n) => (
            <article
              key={n.id}
              className="flex gap-5 rounded-xl border border-neutral-dark/10 bg-white p-6"
            >
              {n.imagem_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={n.imagem_url}
                  alt=""
                  className="hidden h-28 w-40 shrink-0 rounded-lg object-cover sm:block"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-dark/60">
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                    {n.categoria}
                  </span>
                  <span>{n.tipo_fonte}</span>
                  {n.publicado_em && (
                    <time dateTime={n.publicado_em}>
                      {new Date(n.publicado_em).toLocaleDateString("pt-BR")}
                    </time>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{n.titulo}</h3>
                {n.resumo && (
                  <p className="mt-2 text-sm text-neutral-dark/70">{n.resumo}</p>
                )}
                {n.url && (
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block truncate text-xs text-accent hover:underline"
                  >
                    {n.url}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

type Props = {
  params: Promise<{ id: string }>;
};

export default function PoliticoDetailPage({ params }: Props) {
  const { id: rawId } = use(params);
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) notFound();

  return (
    <Suspense fallback={FALHA_LOADING}>
      <PerfilContent id={id} />
    </Suspense>
  );
}