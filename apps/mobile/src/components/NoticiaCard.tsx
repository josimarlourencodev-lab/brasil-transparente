import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Chip } from "./Chip";
import { Cores, Bordas, Espacamento, Sombras, Tipografia } from "../theme";
import type { NoticiaComPolitico } from "../types";

function formatarData(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

export function NoticiaCard({
  noticia,
  onPress,
}: {
  noticia: NoticiaComPolitico;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
    >
      {noticia.imagem_url ? (
        <Image
          source={{ uri: noticia.imagem_url }}
          style={{ height: 140, backgroundColor: Cores.primariaClara }}
          resizeMode="cover"
        />
      ) : null}
      <View style={{ padding: Espacamento.md }}>
        <View style={styles.meta}>
          <Chip>{noticia.categoria}</Chip>
          <Text style={styles.metaTexto}>{noticia.tipo_fonte}</Text>
          {noticia.contradicao_detectada ? (
            <Chip destaque>contradição</Chip>
          ) : null}
        </View>
        <Text style={styles.titulo} numberOfLines={3}>
          {noticia.titulo}
        </Text>
        {noticia.resumo ? (
          <Text style={styles.resumo} numberOfLines={2}>
            {noticia.resumo}
          </Text>
        ) : null}
        <View style={styles.rodape}>
          {noticia.politico ? (
            <Text style={styles.politico}>
              {noticia.politico.nome}
              {noticia.politico.partido
                ? ` · ${noticia.politico.partido}`
                : ""}
            </Text>
          ) : null}
          <Text style={styles.metaTexto}>
            {formatarData(noticia.publicado_em)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Cores.superficie,
    borderRadius: Bordas.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Cores.borda,
    ...Sombras.card,
  },
  meta: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  metaTexto: {
    fontSize: Tipografia.detalhe,
    color: Cores.textoSecundario,
  },
  titulo: {
    fontSize: Tipografia.corpo,
    fontWeight: "600",
    color: Cores.texto,
  },
  resumo: {
    fontSize: Tipografia.detalhe,
    color: Cores.textoSecundario,
    marginTop: 6,
  },
  rodape: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },
  politico: {
    fontSize: Tipografia.detalhe,
    fontWeight: "600",
    color: Cores.primaria,
    flexShrink: 1,
  },
});