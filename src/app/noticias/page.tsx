import Link from "next/link";

export default function NoticiasPage() {
  const noticias = [
    {
      id: 1,
      titulo: "Nenhuma matéria coletada ainda",
      resumo:
        "O sistema de ingestão automática ainda está configurando as fontes. As notícias aparecerão aqui após a primeira execução do GitHub Actions.",
      categoria: "Sistema",
      tipo_fonte: "imprensa" as const,
      publicado_em: null as string | null,
    },
  ];

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

        <div className="mt-8 grid gap-4">
          {noticias.map((n) => (
            <article
              key={n.id}
              className="rounded-xl border border-neutral-dark/10 bg-white p-6"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-dark/60">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                  {n.categoria}
                </span>
                <span>{n.tipo_fonte}</span>
                {n.publicado_em && <time>{n.publicado_em}</time>}
              </div>
              <h2 className="mt-3 text-lg font-semibold">{n.titulo}</h2>
              <p className="mt-2 text-sm text-neutral-dark/70">{n.resumo}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}