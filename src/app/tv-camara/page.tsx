import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TV Câmara — Ao vivo",
  description:
    "Retransmissão ao vivo da TV Câmara. Dados oficiais e neutrados, com foco em acessibilidade e transparência.",
  alternates: { canonical: "/tv-camara" },
};

const TV_CAMARA_HLS = "https://stream3.camara.gov.br/tv1/manifest.m3u8";

export default function TvCamaraPage() {
  return (
    <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-8">
      <div className="w-full max-w-5xl">
        <h1 className="mb-2 text-center font-display text-2xl font-semibold text-primary sm:text-3xl dark:text-primary-light">
          TV Câmara — Ao vivo
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-dark/70 dark:text-neutral-400">
          Retransmissão ao vivo da TV Câmara (Câmara dos Deputados). Link oficial
          de stream HLS utilizado conforme disponibilizado publicamente.
        </p>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-neutral-dark/10 bg-black dark:border-white/10">
          <video
            className="h-full w-full"
            controls
            playsInline
            preload="metadata"
            poster="https://www.camara.leg.br/tema/assets/images/_placeholders/video-placeholder.png"
            aria-label="TV Câmara ao vivo"
          >
            <source src={TV_CAMARA_HLS} type="application/x-mpegURL" />
            Seu navegador não suporta reprodução de vídeo HLS neste elemento.
          </video>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-dark/60 dark:text-neutral-400">
          Fonte:{" "}
          <a
            href="https://www.camara.leg.br/tv"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-primary dark:hover:text-primary-light"
          >
            tv.camara.leg.br
          </a>
          . Stream oficial (HLS). Conforme diretriz: prioriza embeds oficiais;
          RTSP apenas se documentado publicamente.
        </p>
      </div>
    </main>
  );
}
