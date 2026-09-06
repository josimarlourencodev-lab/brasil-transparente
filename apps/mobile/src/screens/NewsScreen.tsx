import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppHeader } from "../components/Header";
import { NoticiaCard } from "../components/NoticiaCard";
import { supabase } from "../lib/supabase";
import { Espacamento, useCores } from "../theme";
import type { NoticiaComPolitico } from "../types";
import type { RootStackParamList } from "../navigation/types";

export function NewsScreen() {
  const c = useCores();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [noticias, setNoticias] = useState<NoticiaComPolitico[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function carregar() {
    const { data, error } = await supabase
      .from("noticias")
      .select("*, politico:politico_id(id, nome, partido, foto_url)")
      .eq("status", "publicado")
      .order("publicado_em", { ascending: false })
      .limit(50);
    if (!error) setNoticias(data ?? []);
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
          data={noticias}
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
            <NoticiaCard
              noticia={item}
              onPress={() =>
                navigation.navigate("DetalheNoticia", { id: item.id })
              }
            />
          )}
        />
      )}
    </View>
  );
}