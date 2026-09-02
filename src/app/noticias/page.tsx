"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Noticia = {
  id: number;
  titulo: string;
  resumo: string | null;
  categoria: string;
  tipo_fonte: string;
  publicado_em: string | null;
  url: string;
  imagem_url: string | null;
  politica: {
    id: number;
    nome: string;
  } | null;
};

export function NoticiasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [busca, setBusca] = useState(q);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (active) setCarregando(true);
    });

    const url = new URL("/api/noticias", window.location.origin);
    url.searchParams.set("limit", "100");
    if (q) url.searchParams.set("q", q);

    fetch(url.toString())
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao carregar notícias.");
        return r.json();
      })
      .then((data: Noticia[]) => {
        if (active) setNoticias(data);
      })
      .catch((e: unknown) => {
        if (active) setErro(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) setCarregando(false);
      });

    return () => {
      active = false;
    };
  }, [q]);

  function buscar() {
    const params = new URLSearchParams(searchParams.toString());
    if (busca.trim()) params.set("q", busca.trim());
    else params.delete("q");
    router.push(`/noticias?${params.toString()}`);
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-neutral-dark/10 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
            Brasil<span className="text-accent"> Transparente</span>
          </Link>
          <Link
            href="/politicos"
            className="text-sm text-neutral-dark/70 hover:text-primary"
          >
            Políticos
          </Link>
        </div>
      </nav>

      <main className="container-page py-12">
        <h1 className="text-3xl font-bold text-primary">Notícias monitoradas</h1>
        <p className="mt-2 text-neutral-dark/70">
          Matérias coletadas de fontes oficiais e de oposição, com referências primárias.
        </p>

        <form
          className="mt-6 flex max-w-xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            buscar();
          }}
        >
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por político ou assunto…"
            className="flex-1 rounded-lg border border-neutral-dark/15 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Buscar
          </button>
        </form>

        {q && (
          <p className="mt-3 text-sm text-neutral-dark/60">
            Resultados para <strong className="text-primary">{q}</strong>
            {noticias.length > 0 ? ` (${noticias.length})` : ""}
          </p>
        )}

        {erro && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </p>
        )}

        {carregando && (
          <p className="mt-8 text-sm text-neutral-dark/60">Carregando…</p>
        )}

        {!carregando && !erro && (
          <div className="mt-8 grid gap-4">
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
                    {n.politica && (
                      <span className="rounded-full bg-accent/10 px-3 py-1 font-medium text-accent">
                        {n.politica.nome}
                      </span>
                    )}
                    {n.publicado_em && (
                      <time dateTime={n.publicado_em}>
                        {new Date(n.publicado_em).toLocaleDateString("pt-BR")}
                      </time>
                    )}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">{n.titulo}</h2>
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

            {noticias.length === 0 && (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-neutral-dark/20 bg-white py-16">
                <p className="text-neutral-dark/60">
                  {q ? "Nenhuma notícia encontrada para esta busca." : "Ainda não há notícias coletadas."}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function NoticiasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <nav className="border-b border-neutral-dark/10 bg-white">
            <div className="container-page flex items-center justify-between py-4">
              <span className="text-xl font-bold tracking-tight text-primary">
                Brasil<span className="text-accent"> Transparente</span>
              </span>
            </div>
          </nav>
          <main className="container-page py-12">
            <p className="text-sm text-neutral-dark/60">Carregando…</p>
          </main>
        </div>
      }
    >
      <NoticiasContent />
    </Suspense>
  );
}