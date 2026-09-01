import Link from "next/link";

export default function PoliticosPage() {
  return (
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
        <h1 className="text-3xl font-bold text-primary">Políticos monitorados</h1>
        <p className="mt-2 text-neutral-dark/70">
          Histórico contextualizado com casos, contradições e posições documentados ao
          longo do tempo.
        </p>

        <div className="mt-8 flex items-center justify-center rounded-xl border border-dashed border-neutral-dark/20 bg-white py-16">
          <p className="text-neutral-dark/60">
            A lista de políticos será preenchida pelo script de ingestão
            (veja <code className="rounded bg-neutral-dark/5 px-1">scripts/feeds.json</code>).
          </p>
        </div>
      </main>
    </div>
  );
}