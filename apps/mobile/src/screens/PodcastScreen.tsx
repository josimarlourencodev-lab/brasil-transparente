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
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { AppHeader } from "../components/Header";
import { Chip } from "../components/Chip";
import { supabase } from "../lib/supabase";
import { Bordas, Cores, Espacamento, Sombras, Tipografia } from "../theme";
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
  const [episodios, setEpisodios] = useState<PodcastEpisodio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reproduzindo, setReproduzindo] = useState<number | null>(null);

  const player = useAudioPlayer(null as unknown as string);
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
      player.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alternar(ep: PodcastEpisodio) {
    if (reproduzindo === ep.id) {
      player.play();
    } else {
      player.replace({ uri: ep.audio_url });
      player.play();
      setReproduzindo(ep.id);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Cores.fundo }}>
      <AppHeader />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Cores.primaria} />
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
              tintColor={Cores.primaria}
            />
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="mic-off-outline" size={40} color={Cores.textoSuave} />
              <Text style={styles.vazioTexto}>
                Nenhum episódio publicado ainda. Volte na próxima semana.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const tocando = reproduzindo === item.id && status.playing;
            return (
              <View style={styles.card}>
                <View style={styles.meta}>
                  <Chip destaque>podcast</Chip>
                  <Text style={styles.metaTexto}>
                    {formatarData(item.publicado_em)} · {formatarDuracao(item.duracao_seg)}
                  </Text>
                </View>
                <Text style={styles.titulo} numberOfLines={2}>
                  {item.titulo}
                </Text>
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
                  <Text style={styles.botaoTexto}>{tocando ? "Pausar" : "Ouvir"}</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Cores.superficie,
    borderRadius: Bordas.card,
    padding: Espacamento.md,
    ...Sombras.card,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Espacamento.sm,
  },
  metaTexto: {
    fontSize: Tipografia.pequena,
    color: Cores.textoSecundario,
  },
  titulo: {
    marginTop: Espacamento.sm,
    fontSize: Tipografia.corpo,
    fontWeight: "700",
    color: Cores.texto,
  },
  descricao: {
    marginTop: Espacamento.xs,
    fontSize: Tipografia.detalhe,
    color: Cores.textoSecundario,
  },
  botaoPlay: {
    marginTop: Espacamento.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Cores.primaria,
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
    color: Cores.textoSecundario,
    fontSize: Tipografia.detalhe,
    textAlign: "center",
  },
});