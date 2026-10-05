import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atividade Legislativa",
  description:
    "Visão agregada da atividade legislativa com dados brutos oficiais. Sem juízo de valor.",
  alternates: { canonical: "/atividade-legislativa" },
};

export default function AtividadeLegislativaPage() {
  return (
    <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-primary sm:text-3xl dark:text-primary-light">
        Atividade Legislativa
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-neutral-dark/70 dark:text-neutral-400">
        Página agregada para explorar autorias, votações nominais e distribuição
        por temas com base em dados brutos das fontes oficiais (Câmara dos
        Deputados e Senado Federal). Estrutura preparada para consumo via views
        SQL.
      </p>
      <p className="mt-6 text-sm text-neutral-dark/60 dark:text-neutral-400">
        Os dados são carregados de forma neutra. Nenhum juízo de valor é
        adicionado às informações apresentadas.
      </p>
    </main>
  );
}
