"use client";

import { useEffect, useState } from "react";

type Episodio = {
  id: number;
  titulo: string;
  descricao: string | null;
  audio_url: string;
  duracao_seg: number | null;
  publicado_em: string;
};

function formatarDuracao(seg: number | null): string {
  if (!seg || seg <= 0) return "Sem duração";
  const min = Math.floor(seg / 60);
  const s = seg % 60;
  return `${min}min ${s.toString().padStart(2, "0")}s`;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function PodcastPage() {
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/podcast/episodios")
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao carregar os episódios do podcast.");
        return r.json();
      })
      .then(setEpisodios)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="min-h-screen">
      <main className="container-page py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary">
          Podcast
        </h1>
        <p className="mt-2 text-neutral-dark/70">
          Episódios semanais com os destaques monitorados pelo Brasil Transparente.
        </p>

        {erro && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </p>
        )}

        <div className="mt-8 space-y-5">
          {episodios.map((ep) => (
            <article
              key={ep.id}
              className="card p-6 transition-shadow hover:shadow-glow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-primary">{ep.titulo}</h2>
                  <p className="mt-1 text-sm text-neutral-dark/70">
                    {formatarData(ep.publicado_em)} · {formatarDuracao(ep.duracao_seg)}
                  </p>
                </div>
                <span className="chip bg-accent/10 text-accent">Novo</span>
              </div>

              {ep.descricao && (
                <p className="mt-3 text-sm text-neutral-dark/70">{ep.descricao}</p>
              )}

              <audio
                controls
                preload="none"
                src={ep.audio_url}
                className="mt-4 w-full"
              >
                Seu navegador não suporta o player de áudio.
              </audio>
            </article>
          ))}
        </div>

        {!erro && episodios.length === 0 && (
          <div className="mt-8 flex items-center justify-center rounded-xl border border-dashed border-neutral-dark/20 bg-white py-16">
            <p className="text-neutral-dark/60">
              Nenhum episódio publicado ainda. Volte na próxima semana.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}