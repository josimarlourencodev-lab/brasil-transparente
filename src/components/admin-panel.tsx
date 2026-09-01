"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminNoticia = {
  id: number;
  titulo: string;
  categoria: string;
  tipo_fonte: string;
  status: string;
  publicado_em: string | null;
  contradicao_detectada: boolean;
};

const STATUS = ["rascunho", "revisao", "publicado", "rejeitado"];

export function AdminPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [noticias, setNoticias] = useState<AdminNoticia[]>([]);
  const [erro, setErro] = useState("");

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