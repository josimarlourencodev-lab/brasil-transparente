import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../components/Header";
import { Chip } from "../components/Chip";
import { MapaBrasilMobile } from "../components/MapaBrasil";
import {
  carregarEleicoes,
  formatarNumero,
  type Candidato,
  type EstadoEleicao,
  type ResumoEleicoes,
} from "../lib/eleicoes";
import { Bordas, Espacamento, Tipografia, useCores } from "../theme";

function formatarData(geradoEm: string | null): string {
  if (!geradoEm) return "—";
  const [data, hora] = geradoEm.split(" ");
  return hora ? `${data} às ${hora}` : data;
}

function Corte({ nome, partido }: { nome: string; partido: string }) {
  const c = useCores();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text
        style={{
          fontSize: Tipografia.corpo,
          fontWeight: "700",
          color: c.texto,
          flex: 1,
        }}
        numberOfLines={1}
      >
        {nome}
      </Text>
      <View
        style={{
          backgroundColor: c.primariaClara,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: Bordas.chip,
        }}
      >
        <Text style={{ fontSize: Tipografia.pequena, color: c.primariaTexto, fontWeight: "700" }}>
          {partido}
        </Text>
      </View>
    </View>
  );
}

export function EleicoesScreen() {
  const c = useCores();
  const styles = criarEstilos(c);
  const [resultado, setResultado] = useState<ResumoEleicoes | null>(null);
  const [estados, setEstados] = useState<EstadoEleicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState(false);

  async function carregar() {
    setErro(false);
    try {
      const { resultado: r, estados: e } = await carregarEleicoes();
      setResultado(r);
      setEstados(e ?? []);
    } catch {
      setErro(true);
    }
  }

  useEffect(() => {
    let stale = false;
    (async () => {
      await carregar();
      if (!stale) setLoading(false);
    })();
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const candidatos =
    resultado?.cargos[0]?.candidatos.filter((c) => !c.anulado) ?? [];
  const lider = candidatos[0]?.votos ?? 1;
  const votosValidos = resultado?.votos;

  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <AppHeader />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.primaria} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Espacamento.md, gap: Espacamento.md }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await carregar();
                setRefreshing(false);
              }}
              tintColor={c.primaria}
            />
          }
        >
          {erro || !resultado ? (
            <View style={styles.estadoAviso}>
              <Ionicons name="hourglass-outline" size={40} color={c.textoSuave} />
              <Text style={styles.estadoAvisoTexto}>
                {erro
                  ? "Não foi possível consultar o TSE neste momento. Puxe para atualizar."
                  : "A totalização presidencial das Eleições 2026 ainda não começou. A divulgação oficial do TSE abre a partir das 17h (horário de Brasília)."}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.cabecalhoBloco}>
                <Text style={styles.tituloBloco}>
                  Apuração da Presidência · {resultado.turno === 2 ? "2º turno" : "1º turno"}
                </Text>
                <Text style={styles.metaBloco}>
                  Atualização: {formatarData(resultado.gerado_em)}
                </Text>
                {resultado.totalizacao_finalizada ? (
                  <View style={{ marginTop: 6 }}>
                    <Chip destaque>Aputação finalizada</Chip>
                  </View>
                ) : null}
              </View>

              <View style={styles.gridResumo}>
                <View style={styles.cardResumo}>
                  <Text style={styles.cardResumoRotulo}>Seções totalizadas</Text>
                  <Text style={styles.cardResumoValor}>
                    {resultado.secao.pct !== null
                      ? `${resultado.secao.pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                      : "—"}
                  </Text>
                  <Text style={styles.cardResumoDetalhe}>
                    {formatarNumero(resultado.secao.totalizada)} de {formatarNumero(resultado.secao.total)}
                  </Text>
                </View>
                <View style={styles.cardResumo}>
                  <Text style={styles.cardResumoRotulo}>Votos válidos</Text>
                  <Text style={styles.cardResumoValor}>{formatarNumero(votosValidos?.validos)}</Text>
                  <Text style={styles.cardResumoDetalhe}>
                    {votosValidos?.pct_validos !== null ? `${votosValidos?.pct_validos?.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total` : "—"}
                  </Text>
                </View>
                <View style={styles.cardResumo}>
                  <Text style={styles.cardResumoRotulo}>Brancos</Text>
                  <Text style={styles.cardResumoValor}>{formatarNumero(votosValidos?.brancos)}</Text>
                  <Text style={styles.cardResumoDetalhe}>
                    {votosValidos && votosValidos.validos > 0
                      ? `${((votosValidos.brancos / (votosValidos.validos + votosValidos.brancos + votosValidos.nulos)) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                      : "—"}
                  </Text>
                </View>
                <View style={styles.cardResumo}>
                  <Text style={styles.cardResumoRotulo}>Nulos</Text>
                  <Text style={styles.cardResumoValor}>{formatarNumero(votosValidos?.nulos)}</Text>
                  <Text style={styles.cardResumoDetalhe}>
                    {votosValidos && votosValidos.validos > 0
                      ? `${((votosValidos.nulos / (votosValidos.validos + votosValidos.brancos + votosValidos.nulos)) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                      : "—"}
                  </Text>
                </View>
              </View>

              {candidatos.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.tituloSeccao}>Ranking — Presidência</Text>
                  <View style={{ marginTop: Espacamento.md, gap: Espacamento.md }}>
                    {candidatos.map((c: Candidato, index: number) => {
                      const largura = lider > 0 ? Math.max((c.votos / lider) * 100, 2) : 0;
                      return (
                        <View key={c.nome_urna}>
                          <View style={styles.linhaRanking}>
                            <Text style={styles.posicao}>{String(index + 1).padStart(2, "0")}</Text>
                            <View style={{ flex: 1 }}>
                              <Corte nome={c.nome_urna} partido={c.partido} />
                            </View>
                            <Text style={styles.votosRanking}>
                              <Text style={styles.pctRanking}>
                                {c.pct_votos_validos !== null
                                  ? `${c.pct_votos_validos.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
                                  : "—"}{" "}
                              </Text>
                              {formatarNumero(c.votos)}
                            </Text>
                          </View>
                          <View style={styles.barraFundo}>
                            <View style={[styles.barraFrente, { width: `${largura}%` }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {estados.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.tituloSeccao}>Onde cada candidato lidera</Text>
                  <Text style={styles.descricaoSeccao}>
                    Estado onde cada candidato tem mais votos válidos apurados até agora.
                  </Text>
                  <View style={{ marginTop: Espacamento.md, gap: Espacamento.sm }}>
<<<<<<< HEAD
                    {estados.map((e: EstadoEleicao) => {
                      const liderEstado = e.votante_maioria;
                      return (
                        <View key={e.uf} style={styles.linhaEstado}>
                          <Text style={styles.ufLabel}>{e.uf_nome}</Text>
                          <Text style={styles.ufValor} numberOfLines={1}>
                            {liderEstado ? liderEstado.nome_urna : "—"}
                          </Text>
                          <Text style={styles.ufPct} numberOfLines={1}>
                            {liderEstado?.pct_votos_validos !== null
                              ? `${liderEstado?.pct_votos_validos?.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                              : "—"}
                          </Text>
                        </View>
                      );
                    })}
=======
                    <MapaBrasilMobile
                      estados={estados}
                      acessivel={estados.length > 0}
                    />
                    <View style={{ marginTop: Espacamento.sm, gap: Espacamento.sm }}>
                      {estados.map((e: EstadoEleicao) => {
                        const liderEstado = e.votante_maioria;
                        return (
                          <View key={e.uf} style={styles.linhaEstado}>
                            <Text style={styles.ufLabel}>{e.uf_nome}</Text>
                            <Text style={styles.ufValor} numberOfLines={1}>
                              {liderEstado ? liderEstado.nome_urna : "—"}
                            </Text>
                            <Text style={styles.ufPct} numberOfLines={1}>
                              {liderEstado?.pct_votos_validos !== null
                                ? `${liderEstado?.pct_votos_validos?.toLocaleString("pt-BR", {
                                    maximumFractionDigits: 1,
                                  })}%`
                                : "—"}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
>>>>>>> origin/develop
                  </View>
                </View>
              ) : null}

              <Pressable
                onPress={() => carregar()}
                style={({ pressed }) => [styles.botaoAtualizar, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.botaoAtualizarTexto}>Atualizar agora</Text>
              </Pressable>

              <Text style={styles.disclaimer}>
                Dados oficiais do TSE (Portal Resultados), atualizados
                automaticamente durante a totalização. {resultado.turno === 2 ? "2º turno: 25/10/2026" : "1º turno: 04/10/2026"}, divulgação a partir das 17h (horário de Brasília).
              </Text>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function criarEstilos(c: ReturnType<typeof useCores>) {
  return StyleSheet.create({
    estadoAviso: {
      alignItems: "center",
      gap: Espacamento.sm,
      paddingVertical: Espacamento.xl,
      paddingHorizontal: Espacamento.md,
      borderRadius: Bordas.card,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: c.borda,
      backgroundColor: c.superficie,
    },
    estadoAvisoTexto: {
      color: c.textoSecundario,
      fontSize: Tipografia.detalhe,
      textAlign: "center",
      lineHeight: 20,
    },
    cabecalhoBloco: {
      padding: Espacamento.md,
      borderRadius: Bordas.card,
      backgroundColor: c.primaria,
    },
    tituloBloco: {
      color: "#fff",
      fontSize: Tipografia.subtitulo,
      fontWeight: "700",
    },
    metaBloco: {
      color: "rgba(255,255,255,0.75)",
      fontSize: Tipografia.detalhe,
      marginTop: 4,
    },
    gridResumo: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Espacamento.sm,
    },
    cardResumo: {
      flexBasis: "47%",
      flexGrow: 1,
      backgroundColor: c.superficie,
      borderRadius: Bordas.card,
      borderWidth: 1,
      borderColor: c.borda,
      padding: Espacamento.md,
    },
    cardResumoRotulo: {
      fontSize: Tipografia.pequena,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      color: c.textoSuave,
    },
    cardResumoValor: {
      fontSize: 22,
      fontWeight: "700",
      color: c.primariaTexto,
      marginTop: 4,
    },
    cardResumoDetalhe: {
      fontSize: Tipografia.pequena,
      color: c.textoSecundario,
      marginTop: 2,
    },
    card: {
      backgroundColor: c.superficie,
      borderRadius: Bordas.card,
      borderWidth: 1,
      borderColor: c.borda,
      padding: Espacamento.md,
    },
    tituloSeccao: {
      fontSize: Tipografia.subtitulo,
      fontWeight: "700",
      color: c.texto,
    },
    descricaoSeccao: {
      marginTop: 2,
      fontSize: Tipografia.detalhe,
      color: c.textoSecundario,
    },
    linhaRanking: {
      flexDirection: "row",
      alignItems: "center",
      gap: Espacamento.sm,
    },
    posicao: {
      fontSize: Tipografia.detalhe,
      fontWeight: "700",
      color: c.textoSuave,
      width: 26,
    },
    votosRanking: {
      fontSize: Tipografia.detalhe,
      color: c.textoSecundario,
    },
    pctRanking: {
      fontWeight: "700",
      color: c.texto,
    },
    barraFundo: {
      marginTop: 6,
      height: 8,
      borderRadius: 999,
      backgroundColor: c.primariaClara,
      overflow: "hidden",
    },
    barraFrente: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: c.acento,
    },
    linhaEstado: {
      flexDirection: "row",
      alignItems: "center",
      gap: Espacamento.sm,
      paddingVertical: Espacamento.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borda,
    },
    ufLabel: {
      fontSize: Tipografia.detalhe,
      color: c.texto,
      fontWeight: "600",
      width: 96,
    },
    ufValor: {
      flex: 1,
      fontSize: Tipografia.detalhe,
      color: c.textoSecundario,
    },
    ufPct: {
      fontSize: Tipografia.detalhe,
      fontWeight: "700",
      color: c.primariaTexto,
      width: 44,
      textAlign: "right",
    },
    botaoAtualizar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: c.primaria,
      borderRadius: Bordas.botao,
      paddingVertical: 12,
    },
    botaoAtualizarTexto: {
      color: "#fff",
      fontWeight: "700",
      fontSize: Tipografia.detalhe,
    },
    disclaimer: {
      fontSize: Tipografia.pequena,
      color: c.textoSuave,
      lineHeight: 16,
      paddingHorizontal: Espacamento.xs,
    },
  });
}