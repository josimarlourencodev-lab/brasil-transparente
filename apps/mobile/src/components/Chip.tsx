import { ReactNode } from "react";
import { Text, View } from "react-native";
import { Tipografia, useCores } from "../theme";

export function Chip({
  children,
  destaque = false,
}: {
  children: ReactNode;
  destaque?: boolean;
}) {
  const c = useCores();
  return (
    <View
      style={{
        backgroundColor: destaque ? c.acentoClara : c.primariaClara,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          fontSize: Tipografia.pequena,
          fontWeight: "600",
          color: destaque ? c.acento : c.primariaTexto,
        }}
      >
        {children}
      </Text>
    </View>
  );
}