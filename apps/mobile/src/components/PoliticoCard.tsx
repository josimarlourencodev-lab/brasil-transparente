import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Cores, Bordas, Espacamento, Sombras, Tipografia } from "../theme";
import type { Politico } from "../types";

export function PoliticoCard({
  politico,
  onPress,
}: {
  politico: Politico;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      {politico.foto_url ? (
        <Image
          source={{ uri: politico.foto_url }}
          style={styles.foto}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.foto, styles.fotoPlaceholder]}>
          <Text style={styles.inicial}>
            {politico.nome.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.nome} numberOfLines={1}>
          {politico.nome}
        </Text>
        <Text style={styles.subtitulo} numberOfLines={1}>
          {politico.partido}
          {politico.cargo ? ` · ${politico.cargo}` : ""}
        </Text>
        {politico.biografia ? (
          <Text style={styles.bio} numberOfLines={2}>
            {politico.biografia}
          </Text>
        ) : null}
        {politico.ficha && politico.ficha.total > 0 ? (
          <View style={styles.badgeFicha}>
            <Text
              style={[
                styles.badgeTexto,
                politico.ficha.indicador === "atencao" && {
                  color: Cores.acento,
                },
              ]}
            >
              {politico.ficha.total === 1
                ? "1 caso documentado"
                : `${politico.ficha.total} casos documentados`}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Cores.superficie,
    borderRadius: Bordas.card,
    padding: Espacamento.md,
    gap: Espacamento.md,
    borderWidth: 1,
    borderColor: Cores.borda,
    ...Sombras.card,
  },
  foto: {
    width: 64,
    height: 64,
    borderRadius: 999,
  },
  fotoPlaceholder: {
    backgroundColor: Cores.primariaClara,
    alignItems: "center",
    justifyContent: "center",
  },
  inicial: {
    fontSize: 24,
    fontWeight: "700",
    color: Cores.primaria,
  },
  nome: {
    fontSize: Tipografia.corpo,
    fontWeight: "700",
    color: Cores.texto,
  },
  subtitulo: {
    fontSize: Tipografia.detalhe,
    fontWeight: "600",
    color: Cores.primaria,
    marginTop: 2,
  },
  bio: {
    fontSize: Tipografia.detalhe,
    color: Cores.textoSecundario,
    marginTop: 4,
  },
  badgeFicha: {
    backgroundColor: Cores.primariaClara,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 6,
  },
  badgeTexto: {
    fontSize: Tipografia.pequena,
    fontWeight: "600",
    color: Cores.primaria,
  },
});