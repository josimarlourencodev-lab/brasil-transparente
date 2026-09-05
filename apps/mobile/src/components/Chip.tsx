import { ReactNode } from "react";
import { Text, View } from "react-native";
import { Cores, Tipografia } from "../theme";

export function Chip({
  children,
  destaque = false,
}: {
  children: ReactNode;
  destaque?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: destaque ? Cores.acentoClara : Cores.primariaClara,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          fontSize: Tipografia.pequena,
          fontWeight: "600",
          color: destaque ? Cores.acento : Cores.primaria,
        }}
      >
        {children}
      </Text>
    </View>
  );
}