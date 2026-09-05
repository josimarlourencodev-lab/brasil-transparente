import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { DetalheNoticiaScreen } from "./src/screens/DetalheNoticiaScreen";
import { DetalhePoliticoScreen } from "./src/screens/DetalhePoliticoScreen";
import { NewsScreen } from "./src/screens/NewsScreen";
import { PoliticosScreen } from "./src/screens/PoliticosScreen";
import type { RootStackParamList, TabParamList } from "./src/navigation/types";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0F4C81",
        tabBarInactiveTintColor: "#A0A09C",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E2DE",
        },
      }}
    >
      <Tab.Screen
        name="Noticias"
        component={NewsScreen}
        options={{
          title: "Notícias",
          tabBarIcon: ({ color }) => <Ionicons name="newspaper-outline" color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Politicos"
        component={PoliticosScreen}
        options={{
          title: "Políticos",
          tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" color={color} size={22} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#0F4C81" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DetalheNoticia"
          component={DetalheNoticiaScreen}
          options={{ title: "Notícia" }}
        />
        <Stack.Screen
          name="DetalhePolitico"
          component={DetalhePoliticoScreen}
          options={{ title: "Perfil" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}