import { Text, View } from "react-native";
import { Espacamento, Tipografia, useCores } from "../theme";

export function AppHeader({ onPress }: { onPress?: () => void }) {
  const c = useCores();
  return (
    <View
      style={{
        backgroundColor: c.primaria,
        paddingTop: Espacamento.md + 8,
        paddingBottom: Espacamento.md,
        paddingHorizontal: Espacamento.md,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: Tipografia.subtitulo,
          fontWeight: "700",
          letterSpacing: -0.2,
        }}
      >
        Brasil Transparente
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: Tipografia.detalhe,
          marginTop: 2,
        }}
      >
        Verdade nas notícias sobre os seus representantes
      </Text>
    </View>
  );
}

export function DetalheHeader({
  titulo,
  corFundo,
}: {
  titulo: string;
  corFundo?: string;
}) {
  const c = useCores();
  return (
    <View
      style={{
        backgroundColor: corFundo ?? c.primaria,
        paddingTop: Espacamento.md + 8,
        paddingBottom: Espacamento.md,
        paddingHorizontal: Espacamento.md,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: Tipografia.subtitulo,
          fontWeight: "700",
        }}
      >
        {titulo}
      </Text>
    </View>
  );
}