import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Chip } from "../components/Chip";
import { NoticiaCard } from "../components/NoticiaCard";
import { supabase } from "../lib/supabase";
import { Cores, Espacamento, Tipografia } from "../theme";
import type { NoticiaComPolitico, Politico } from "../types";
import type { RootStackParamList } from "../navigation/types";

type Rota = RouteProp<RootStackParamList, "DetalhePolitico">;

export function DetalhePoliticoScreen() {
  const route = useRoute<Rota>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = route.params;
  const [politico, setPolitico] = useState<Politico | null>(null);
  const [noticias, setNoticias] = useState<NoticiaComPolitico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stale = false;
    (async () => {
      const { data: pData, error: pError } = await supabase
        .from("politicos")
        .select("*")
        .eq("id", id)
        .eq("ativo", true)
        .single();
      if (pError) {
        if (!stale) setLoading(false);
        return;
      }
      if (!stale) setPolitico(pData);
      const { data: nData, error: nError } = await supabase
        .from("noticias")
        .select("*, politico:politico_id(id, nome, partido, foto_url)")
        .eq("status", "publicado")
        .eq("politico_id", id)
        .order("publicado_em", { ascending: false })
        .limit(50);
      if (!nError && !stale) {
        setNoticias(
          nData && nData.length > 0
            ? nData
            : await buscarPorNome(pData.nome)
        );
      }
      if (!stale) setLoading(false);
    })();
    return () => {
      stale = true;
    };
  }, [id]);

  async function buscarPorNome(nome: string): Promise<NoticiaComPolitico[]> {
    const { data } = await supabase
      .from("noticias")
      .select("*, politico:politico_id(id, nome, partido, foto_url)")
      .eq("status", "publicado")
      .or(`titulo.ilike.%${nome}%,resumo.ilike.%${nome}%`)
      .order("publicado_em", { ascending: false })
      .limit(50);
    return data ?? [];
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Cores.fundo }}
      contentContainerStyle={{ paddingBottom: Espacamento.xl }}
    >
      <View style={{ padding: Espacamento.md, gap: Espacamento.md }}>
        <View style={{ alignItems: "center", paddingTop: Espacamento.md }}>
          {politico?.foto_url ? (
            <Image
              source={{ uri: politico.foto_url }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                backgroundColor: Cores.primariaClara,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                backgroundColor: Cores.primariaClara,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "700",
                  color: Cores.primaria,
                }}
              >
                {politico?.nome.charAt(0).toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <Text
            style={{
              fontSize: Tipografia.subtitulo,
              fontWeight: "700",
              color: Cores.texto,
              marginTop: Espacamento.md,
              textAlign: "center",
            }}
          >
            {politico?.nome ?? ""}
          </Text>
          <Text
            style={{
              fontSize: Tipografia.detalhe,
              fontWeight: "600",
              color: Cores.primaria,
              marginTop: 4,
            }}
          >
            {politico?.partido}
            {politico?.cargo ? ` · ${politico.cargo}` : ""}
          </Text>
        </View>

        {politico?.biografia ? (
          <Text
            style={{
              fontSize: Tipografia.corpo,
              lineHeight: 22,
              color: Cores.textoSecundario,
              textAlign: "center",
            }}
          >
            {politico.biografia}
          </Text>
        ) : null}

        <Text
          style={{
            fontSize: Tipografia.subtitulo,
            fontWeight: "700",
            color: Cores.texto,
            marginTop: Espacamento.sm,
          }}
        >
          Notícias relacionadas
        </Text>

        {noticias.map((n) => (
          <NoticiaCard
            key={String(n.id)}
            noticia={n}
            onPress={() =>
              navigation.navigate("DetalheNoticia", { id: n.id })
            }
          />
        ))}

        {!loading && noticias.length === 0 ? (
          <Text
            style={{
              fontSize: Tipografia.detalhe,
              color: Cores.textoSecundario,
              textAlign: "center",
              marginTop: Espacamento.sm,
            }}
          >
            Nenhuma notícia relacionada por enquanto.
          </Text>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={Cores.primaria} />
        ) : null}

        {politico ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip>{politico.termos_busca?.length ?? 0} termos de busca</Chip>
          </View>
        ) : null}
      </View>

      {!politico && !loading ? (
        <Text
          style={{
            fontSize: Tipografia.detalhe,
            color: Cores.textoSecundario,
            textAlign: "center",
            marginTop: 40,
          }}
        >
          Político não encontrado.
        </Text>
      ) : null}
    </ScrollView>
  );
}