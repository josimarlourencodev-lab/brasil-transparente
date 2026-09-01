import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../lib/supabase";
import type { Noticia } from "../types";

export function NewsScreen() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stale = false;
    (async () => {
      const { data, error } = await supabase
        .from("noticias")
        .select("*")
        .eq("status", "publicado")
        .order("publicado_em", { ascending: false })
        .limit(50);
      if (!stale && !error) setNoticias(data ?? []);
      setLoading(false);
    })();
    return () => {
      stale = true;
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      <StatusBar style="auto" />
      <View style={{ padding: 16, backgroundColor: "#0F4C81" }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>
          Brasil Transparente
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#0F4C81" />
      ) : (
        <FlatList
          data={noticias}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: "#E2E2DE",
              }}
            >
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#0F4C81",
                    backgroundColor: "#EDF2F7",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                  }}
                >
                  {item.categoria}
                </Text>
                <Text style={{ fontSize: 11, color: "#7a7a76" }}>{item.tipo_fonte}</Text>
                {item.contradicao_detectada ? (
                  <Text style={{ fontSize: 11, color: "#C8102E", fontWeight: "700" }}>
                    contradição
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A1A" }}>
                {item.titulo}
              </Text>
              {item.resumo ? (
                <Text style={{ fontSize: 13, color: "#5a5a56", marginTop: 6 }}>
                  {item.resumo}
                </Text>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}