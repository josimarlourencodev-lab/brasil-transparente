import { Platform } from "react-native";
import {
  createAudioPlayer,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";

setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: "doNotMix",
}).catch(() => {});

if (Platform.OS === "android") {
  requestNotificationPermissionsAsync().catch(() => {});
}

export const audioPlayer = createAudioPlayer();