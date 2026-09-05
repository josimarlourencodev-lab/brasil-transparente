import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Chip } from "../components/Chip";
import { supabase } from "../lib/supabase";
import { Cores, Espacamento, Tipografia } from "../theme";
import type { NoticiaComPolitico } from "../types";
import type { RootStackParamList } from "../navigation/types";

type Rota = RouteProp<RootStackParamList, "DetalheNoticia">;

function formatarData(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function DetalheNoticiaScreen() {
  const route = useRoute<Rota>();
  const { id } = route.params;
  const [noticia, setNoticia] = useState<NoticiaComPolitico | null>(null);

  useEffect(() => {
    let stale = false;
    (async () => {
      const { data, error } = await supabase
        .from("noticias")
        .select("*, politico:politico_id(id, nome, partido, foto_url)")
        .eq("id", id)
        .single();
      if (!stale && !error) setNoticia(data);
    })();
    return () => {
      stale = true;
    };
  }, [id]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Cores.fundo }}
      contentContainerStyle={{ paddingBottom: Espacamento.xl }}
    >
      <View style={{ padding: Espacamento.md, gap: Espacamento.md }}>
        <View
          style={{
            paddingTop: Espacamento.md,
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Chip>{noticia?.categoria ?? "—"}</Chip>
          {noticia?.tipo_fonte ? (
            <Text style={{ fontSize: Tipografia.detalhe, color: Cores.textoSecundario }}>
              {noticia.tipo_fonte}
            </Text>
          ) : null}
          {noticia?.contradicao_detectada ? <Chip destaque>contradição</Chip> : null}
        </View>

        <Text
          style={{
            fontSize: Tipografia.subtitulo,
            fontWeight: "700",
            color: Cores.texto,
            letterSpacing: -0.2,
          }}
        >
          {noticia?.titulo ?? ""}
        </Text>

        <Text style={{ fontSize: Tipografia.detalhe, color: Cores.textoSecundario }}>
          {formatarData(noticia?.publicado_em)}
        </Text>

        {noticia?.politico ? (
          <View
            style={{
              backgroundColor: Cores.primariaClara,
              padding: Espacamento.md,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: Tipografia.detalhe, color: Cores.primaria }}>
              <Text style={{ fontWeight: "700" }}>Político:</Text>{" "}
              {noticia.politico.nome}
              {noticia.politico.partido ? ` · ${noticia.politico.partido}` : ""}
            </Text>
          </View>
        ) : null}

        {noticia?.resumo ? (
          <Text
            style={{
              fontSize: Tipografia.corpo,
              lineHeight: 22,
              color: Cores.texto,
            }}
          >
            {noticia.resumo}
          </Text>
        ) : null}

        {noticia?.contradicao_descricao ? (
          <View
            style={{
              backgroundColor: Cores.acentoClara,
              padding: Espacamento.md,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Cores.acento,
            }}
          >
            <Text
              style={{
                fontSize: Tipografia.detalhe,
                fontWeight: "700",
                color: Cores.acento,
                marginBottom: 4,
              }}
            >
              Contraposição encontrada
            </Text>
            <Text style={{ fontSize: Tipografia.detalhe, color: Cores.texto }}>
              {noticia.contradicao_descricao}
            </Text>
          </View>
        ) : null}

        {noticia ? (
          <Pressable
            onPress={() => Linking.openURL(noticia.url)}
            style={({ pressed }) => [
              {
                backgroundColor: Cores.primaria,
                padding: Espacamento.md,
                borderRadius: 12,
                alignItems: "center",
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Ler matéria original
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!noticia ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Cores.primaria} />
      ) : null}
    </ScrollView>
  );
}