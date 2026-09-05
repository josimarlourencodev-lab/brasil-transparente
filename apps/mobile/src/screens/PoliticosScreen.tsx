import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppHeader } from "../components/Header";
import { PoliticoCard } from "../components/PoliticoCard";
import { supabase } from "../lib/supabase";
import { Cores, Espacamento } from "../theme";
import type { Politico } from "../types";
import type { RootStackParamList } from "../navigation/types";

export function PoliticosScreen() {
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
    if (!error) setPoliticos(data ?? []);
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
    <View style={{ flex: 1, backgroundColor: Cores.fundo }}>
      <AppHeader />
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color={Cores.primaria}
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
              tintColor={Cores.primaria}
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