import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Temas — ${slug}`,
    description: "Distribuição neutra de votações por tema com base em dados oficiais.",
    alternates: { canonical: `/temas/${slug}` },
  };
}

export default async function TemaPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-primary sm:text-3xl dark:text-primary-light">
        Tema: {slug}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-neutral-dark/70 dark:text-neutral-400">
        Distribuição de votações por tema (quem votou a favor/contra/abstenção/ausente),
        por partido e UF, com base em dados brutos oficiais. Estrutura preparada
        para leitura via view <code className="text-xs">vw_distribuicao_tema</code>.
      </p>
      <p className="mt-6 text-sm text-neutral-dark/60 dark:text-neutral-400">
        Apresentação estritamente factual e neutra, sem adição de juízos de valor.
      </p>
    </main>
  );
}
