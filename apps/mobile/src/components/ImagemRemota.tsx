import { Image, type ImageContentFit, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";

const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";

const headers = { "User-Agent": USER_AGENT };

export function ImagemRemota({
  uri,
  style,
  contentFit = "cover",
}: {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
}) {
  return (
    <Image
      source={{ uri, headers }}
      style={style}
      contentFit={contentFit}
      transition={150}
    />
  );
}