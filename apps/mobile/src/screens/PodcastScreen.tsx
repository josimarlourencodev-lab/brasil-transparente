import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayerStatus } from "expo-audio";
import { AppHeader } from "../components/Header";
import { audioPlayer } from "../lib/audio";
import { supabase } from "../lib/supabase";
import { Bordas, Espacamento, Tipografia, useCores } from "../theme";
import type { PodcastEpisodio } from "../types";

function formatarDuracao(seg: number | null): string {
  if (!seg || seg <= 0) return "sem duração";
  const min = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${min}min ${s.toString().padStart(2, "0")}s`;
}

function formatarData(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function PodcastScreen() {
  const c = useCores();
  const styles = criarEstilos(c);
  const [episodios, setEpisodios] = useState<PodcastEpisodio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reproduzindo, setReproduzindo] = useState<number | null>(null);

  const player = audioPlayer;
  const status = useAudioPlayerStatus(player);

  async function carregar() {
    const { data, error } = await supabase
      .from("podcast_episodios")
      .select("id, titulo, descricao, audio_url, duracao_seg, publicado_em")
      .order("publicado_em", { ascending: false })
      .limit(30);
    if (!error) setEpisodios(data ?? []);
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

  function ativarTelaBloqueio(ep: PodcastEpisodio) {
    player.setActiveForLockScreen(
      true,
      { title: ep.titulo, artist: "Brasil Transparente" },
      { showSeekBackward: true, showSeekForward: true }
    );
  }

  function alternar(ep: PodcastEpisodio) {
    if (reproduzindo === ep.id) {
      if (status.playing) {
        player.pause();
      } else {
        player.play();
      }
    } else {
      player.replace({ uri: ep.audio_url });
      setReproduzindo(ep.id);
      ativarTelaBloqueio(ep);
      player.play();
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <AppHeader />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.primaria} />
      ) : (
        <FlatList
          data={episodios}
          keyExtractor={(item) => String(item.id)}
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
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="mic-off-outline" size={40} color={c.textoSuave} />
              <Text style={styles.vazioTexto}>
                Nenhum episódio publicado ainda. Volte na próxima semana.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const tocando = reproduzindo === item.id && status.playing;
            return (
              <View style={styles.card}>
                <View style={styles.cabecalho}>
                  <View style={styles.numeroBloco}>
                    <Text style={styles.numero}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.titulo} numberOfLines={2}>
                      {item.titulo}
                    </Text>
                    <View style={styles.meta}>
                      <Text style={styles.metaTexto}>
                        {formatarData(item.publicado_em)} ·{" "}
                        {formatarDuracao(item.duracao_seg)}
                      </Text>
                      {index === 0 ? (
                        <Text
                          style={[
                            styles.maisRecente,
                            { color: c.acento, backgroundColor: c.acentoClara },
                          ]}
                        >
                          Mais recente
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
                {item.descricao ? (
                  <Text style={styles.descricao} numberOfLines={3}>
                    {item.descricao}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => alternar(item)}
                  style={({ pressed }) => [
                    styles.botaoPlay,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name={tocando ? "pause" : "play"}
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.botaoTexto}>
                    {tocando ? "Pausar" : "Ouvir"}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function criarEstilos(c: ReturnType<typeof useCores>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.superficie,
      borderRadius: Bordas.card,
      padding: Espacamento.md,
      borderWidth: 1,
      borderColor: c.borda,
    },
    cabecalho: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Espacamento.sm,
    },
    numeroBloco: {
      width: 40,
      height: 40,
      borderRadius: Bordas.botao,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primariaClara,
    },
    numero: {
      fontSize: Tipografia.subtitulo,
      fontWeight: "700",
      color: c.primariaTexto,
    },
    titulo: {
      fontSize: Tipografia.corpo,
      fontWeight: "700",
      color: c.texto,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: Espacamento.sm,
      marginTop: 2,
      flexWrap: "wrap",
    },
    maisRecente: {
      fontSize: Tipografia.pequena,
      fontWeight: "700",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Bordas.chip,
      overflow: "hidden",
    },
    metaTexto: {
      fontSize: Tipografia.pequena,
      color: c.textoSecundario,
    },
    descricao: {
      marginTop: Espacamento.sm,
      fontSize: Tipografia.detalhe,
      color: c.textoSecundario,
    },
    botaoPlay: {
      marginTop: Espacamento.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: c.primaria,
      borderRadius: Bordas.botao,
      paddingVertical: 10,
    },
    botaoTexto: {
      color: "#fff",
      fontWeight: "700",
      fontSize: Tipografia.detalhe,
    },
    vazio: {
      alignItems: "center",
      gap: Espacamento.sm,
      paddingVertical: Espacamento.xl,
    },
    vazioTexto: {
      color: c.textoSecundario,
      fontSize: Tipografia.detalhe,
      textAlign: "center",
    },
  });
}