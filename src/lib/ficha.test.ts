import { describe, expect, it } from "vitest";
import { resumirFicha, rotuloStatusCaso, rotuloTipoCaso } from "./ficha";
import type { CasoFicha } from "./ficha";

function caso(parcial: Partial<CasoFicha>): CasoFicha {
  return {
    id: 1,
    politico_id: 1,
    tipo: "processo",
    status: "em_andamento",
    titulo: "x",
    descricao: null,
    orgao: null,
    data_fato: null,
    fontes: [],
    criado_em: "2026-09-06T00:00:00Z",
    atualizado_em: "2026-09-06T00:00:00Z",
    ...parcial,
  };
}

describe("resumirFicha", () => {
  it("sem casos → sem_casos", () => {
    expect(resumirFicha([])).toEqual({ total: 0, indicador: "sem_casos" });
  });

  it("casos comuns → com_casos", () => {
    expect(resumirFicha([caso({})])).toEqual({
      total: 1,
      indicador: "com_casos",
    });
  });

  it("condenação tipo → atencao", () => {
    expect(
      resumirFicha([caso({ tipo: "condenacao" })])
    ).toMatchObject({ indicador: "atencao" });
  });

  it("status condenado → atencao", () => {
    expect(
      resumirFicha([caso({ status: "condenado" })])
    ).toMatchObject({ indicador: "atencao" });
  });

  it("cassação → atencao", () => {
    expect(
      resumirFicha([caso({ tipo: "cassacao" })])
    ).toMatchObject({ indicador: "atencao" });
  });
});

describe("rótulos", () => {
  it("rotuloTipoCaso traduz tipos", () => {
    expect(rotuloTipoCaso("condenacao")).toBe("Condenação");
    expect(rotuloTipoCaso("processo")).toBe("Processo");
    expect(rotuloTipoCaso("outro")).toBe("Caso documentado");
  });

  it("rotuloStatusCaso traduz status", () => {
    expect(rotuloStatusCaso("em_andamento")).toBe("Em andamento");
    expect(rotuloStatusCaso("sem_informacao")).toBe("Sem informação");
  });
});