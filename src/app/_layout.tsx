import "../global.css";
import "@/utils/fetch-polyfill";

import { Stack } from "expo-router";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export { ErrorBoundary } from "expo-router";

// These are the default stack options for iOS, they disable on other platforms.
const DEFAULT_STACK_HEADER: NativeStackNavigationOptions =
  process.env.EXPO_OS !== "ios"
    ? {}
    : {
        headerTransparent: false,
        headerShadowVisible: true,
        headerLargeTitleShadowVisible: false,
      };

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <Stack screenOptions={DEFAULT_STACK_HEADER}>
          <Stack.Screen
            name="index"
            options={{
              title: "Starprince AI",
              headerShown: false, // Hide header for edge-to-edge
            }}
          />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
