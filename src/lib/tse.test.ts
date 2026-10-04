import { describe, expect, it } from "vitest";
import { urlDeUF } from "./tse";

describe("urlDeUF", () => {
  it("usa código da eleição com 6 dígitos (zero à esquerda) no nome do arquivo", () => {
    expect(urlDeUF("br", "6257")).toBe(
      "https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json"
    );
    expect(urlDeUF("sp", "6258")).toContain("sp-c0001-e006258-u.json");
  });

  it("prenche menos de 6 dígitos com zeros à esquerda", () => {
    expect(urlDeUF("ac", "21270")).toContain("ac-c0001-e021270-u.json");
  });

  it("mantém o ambiente customizado (simulado) com placeholder da eleição", () => {
    const original = process.env.TSE_RESULTADOS_URL;
    process.env.TSE_RESULTADOS_URL =
      "https://resultados-sim.tse.jus.br/simulado/simulado2026/ele2026/{eleicao}/dados/{uf}/{uf}-c0001-e{eleicao}-u.json";
    expect(urlDeUF("br", "21270")).toContain(
      "dados/br/br-c0001-e21270-u.json"
    );
    if (original === undefined) delete process.env.TSE_RESULTADOS_URL;
    else process.env.TSE_RESULTADOS_URL = original;
  });
});