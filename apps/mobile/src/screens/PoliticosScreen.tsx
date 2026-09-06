import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppHeader } from "../components/Header";
import { PoliticoCard } from "../components/PoliticoCard";
import { supabase } from "../lib/supabase";
import { Espacamento, useCores } from "../theme";
import type { Politico } from "../types";
import type { RootStackParamList } from "../navigation/types";

export function PoliticosScreen() {
  const c = useCores();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [politicos, setPoliticos] = useState<Politico[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function carregar() {
    const { data, error } = await supabase
      .from("politicos")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    if (error) return;
    const politicosCarregados = data as Politico[];

    const ids = politicosCarregados.map((p) => p.id);
    const { data: fichas, error: erroFichas } = await supabase
      .from("ficha_politico")
      .select("id, politico_id, tipo, status")
      .in("politico_id", ids);
    if (erroFichas) {
      setPoliticos(politicosCarregados);
      return;
    }

    const porPolitico = new Map<number, { total: number; atencao: boolean }>();
    for (const f of fichas ?? []) {
      const atual = porPolitico.get(f.politico_id) ?? { total: 0, atencao: false };
      atual.total += 1;
      if (f.tipo === "condenacao" || f.tipo === "inelegibilidade" || f.tipo === "cassacao" || f.status === "condenado") {
        atual.atencao = true;
      }
      porPolitico.set(f.politico_id, atual);
    }

    setPoliticos(
      politicosCarregados.map((p) => {
        const resumo = porPolitico.get(p.id);
        return {
          ...p,
          ficha: resumo
            ? {
                total: resumo.total,
                indicador: resumo.atencao
                  ? ("atencao" as const)
                  : ("com_casos" as const),
              }
            : { total: 0, indicador: "sem_casos" as const },
        };
      })
    );
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
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <AppHeader />
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color={c.primaria}
        />
      ) : (
        <FlatList
          data={politicos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            padding: Espacamento.md,
            gap: Espacamento.md,
          }}
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
          renderItem={({ item }) => (
            <PoliticoCard
              politico={item}
              onPress={() =>
                navigation.navigate("DetalhePolitico", { id: item.id })
              }
            />
          )}
        />
      )}
    </View>
  );
}