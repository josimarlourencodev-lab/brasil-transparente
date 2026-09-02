"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminNoticia = {
  id: number;
  titulo: string;
  categoria: string;
  tipo_fonte: string;
  status: string;
  publicado_em: string | null;
  contradicao_detectada: boolean;
  imagem_url: string | null;
};

const STATUS = ["rascunho", "revisao", "publicado", "rejeitado"];

const FORM_INICIAL = {
  titulo: "",
  url: "",
  resumo: "",
  categoria: "",
  imagem_url: "",
};

export function AdminPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [noticias, setNoticias] = useState<AdminNoticia[]>([]);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    const qs = status ? `?status=${status}` : "";

    (async () => {
      try {
        const res = await fetch(`/api/admin/noticias${qs}`);
        if (res.status === 401) {
          await fetch("/api/admin/logout", { method: "POST" });
          router.refresh();
          return;
        }
        if (!res.ok) {
          if (ativo) setErro("Falha ao carregar matérias.");
          return;
        }
        if (ativo) setNoticias(await res.json());
      } catch {
        if (ativo) setErro("Erro ao carregar.");
      }
    })();

    return () => {
      ativo = false;
    };
  }, [status, router]);

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/noticias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          url: form.url,
          resumo: form.resumo,
          categoria: form.categoria,
          imagem_url: form.imagem_url,
        }),
      });
      if (res.status === 401) {
        await fetch("/api/admin/logout", { method: "POST" });
        router.refresh();
        return;
      }
      const payload = await res.json();
      if (!res.ok) {
        setErro(typeof payload?.error === "string" ? payload.error : "Não foi possível adicionar a matéria.");
        return;
      }
      setForm(FORM_INICIAL);
      setNoticias((prev) => [payload, ...prev]);
    } catch {
      setErro("Erro ao salvar a matéria.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(n: AdminNoticia) {
    if (!window.confirm(`Remover a matéria "${n.titulo}"?`)) return;
    setErro("");
    try {
      const res = await fetch(`/api/admin/noticias?id=${n.id}`, { method: "DELETE" });
      if (res.status === 401) {
        await fetch("/api/admin/logout", { method: "POST" });
        router.refresh();
        return;
      }
      if (!res.ok) {
        setErro("Falha ao remover a matéria.");
        return;
      }
      setNoticias((prev) => prev.filter((x) => x.id !== n.id));
    } catch {
      setErro("Erro ao remover a matéria.");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-dark text-white">
      <div className="container-page py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-accent-light">
            Painel do Administrador / Auditor
          </h1>
          <button
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              router.refresh();
            }}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:text-white"
          >
            Sair
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setStatus("")}
            className={`rounded-full px-3 py-1 text-sm ${status === "" ? "bg-accent text-white" : "border border-white/15 text-white/70"}`}
          >
            todas
          </button>
          {STATUS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-sm ${status === s ? "bg-accent text-white" : "border border-white/15 text-white/70"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {erro ? <p className="mt-4 text-sm text-red-400">{erro}</p> : null}

        <form
          onSubmit={adicionar}
          className="mt-6 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2"
        >
          <h2 className="text-sm font-semibold text-white/80 sm:col-span-2">
            Adicionar matéria
          </h2>
          <input
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título"
            required
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="URL (http:// ou https://)"
            required
            type="url"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
          />
          <input
            value={form.resumo}
            onChange={(e) => setForm({ ...form, resumo: e.target.value })}
            placeholder="Resumo (opcional)"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent sm:col-span-2"
          />
          <input
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            placeholder="Categoria (padrão: Outros)"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
          />
          <input
            value={form.imagem_url}
            onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
            placeholder="URL da imagem (opcional)"
            type="url"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
          />
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 sm:col-span-2"
          >
            {salvando ? "Salvando…" : "Adicionar matéria"}
          </button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-white/50">
              <tr>
                <th className="p-3">Título</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Fonte</th>
                <th className="p-3">Status</th>
                <th className="p-3">Publicado</th>
                <th className="p-3">Contradição</th>
                <th className="p-3" aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {noticias.map((n) => (
                <tr key={n.id} className="border-b border-white/5">
                  <td className="p-3 text-white/90">{n.titulo}</td>
                  <td className="p-3 text-white/60">{n.categoria}</td>
                  <td className="p-3 text-white/60">{n.tipo_fonte}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        n.status === "publicado"
                          ? "bg-green-500/20 text-green-300"
                          : n.status === "revisao"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-white/10 text-white/60"
                      }`}
                    >
                      {n.status}
                    </span>
                  </td>
                  <td className="p-3 text-white/60">{n.publicado_em ?? "—"}</td>
                  <td className="p-3">{n.contradicao_detectada ? "sim" : "não"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => remover(n)}
                      className="rounded-md border border-red-400/40 px-2 py-1 text-xs text-red-300 hover:bg-red-400/10"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {noticias.length === 0 ? (
            <p className="p-4 text-white/50">Nenhuma matéria encontrada.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}