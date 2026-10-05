/**
 * Helpers neutros para Atividade Legislativa (dados brutos oficiais)
 */

import type { VotoBruto } from "@/types/legislativo";

export const VOTO_ROTULOS_PT: Record<VotoBruto, string> = {
  favor: "Favor",
  contra: "Contra",
  abstencao: "Abstenção",
  ausente: "Ausente",
  artigo_17: "Art. 17",
  nao_registrado: "Não registrado",
  obstrucao: "Obstrução",
};

export function normalizarVotoBruto(votoOriginal?: string | null): VotoBruto {
  if (!votoOriginal) return "nao_registrado";
  const v = votoOriginal
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (v === "SIM" || v === "S" || v === "FAVOR" || v === "YES") return "favor";
  if (v === "NAO" || v === "NÃO" || v === "N" || v === "CONTRA" || v === "NO") return "contra";
  if (v === "ABSTENCAO" || v === "ABSTENÇÃO" || v === "ABST") return "abstencao";
  if (v === "AUSENTE" || v === "AUS") return "ausente";
  if (v.includes("ARTIGO 17") || v.includes("ART.17") || v.includes("ART 17")) return "artigo_17";
  if (v.includes("OBSTRUCAO") || v.includes("OBSTRUÇÃO")) return "obstrucao";
  if (v === "NAOREGISTRADO" || v === "NAO REGISTRADO") return "nao_registrado";

  return "nao_registrado";
}

export function formatoSiglaProposicao(tipo: string, numero: number, ano: number) {
  return `${tipo} ${numero}/${ano}`;
}
