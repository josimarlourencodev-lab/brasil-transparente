"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setErro("Senha inválida.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-xl border border-white/10 bg-white/5 p-8">
      <h1 className="text-2xl font-bold text-accent-light">Painel do Administrador</h1>
      <p className="mt-1 text-sm text-white/60">Acesso restrito a auditores.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          autoComplete="current-password"
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white outline-none focus:border-accent-light"
        />
        {erro ? <p className="text-sm text-red-400">{erro}</p> : null}
        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-lg bg-accent px-3 py-2 font-semibold text-white disabled:opacity-60"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}