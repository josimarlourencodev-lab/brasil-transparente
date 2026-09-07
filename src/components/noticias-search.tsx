"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function NoticiasSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState(searchParams.get("q") ?? "");

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (busca.trim()) params.set("q", busca.trim());
    else params.delete("q");
    router.push(`/noticias?${params.toString()}`);
  }

  return (
    <form
      className="mt-6 flex max-w-xl gap-2"
      onSubmit={buscar}
      role="search"
    >
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por político ou assunto…"
        aria-label="Buscar por político ou assunto"
        className="flex-1 rounded-lg border border-neutral-dark/15 bg-white px-4 py-2 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-neutral-panel dark:text-neutral-100 dark:focus:border-primary-light"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Buscar
      </button>
    </form>
  );
}