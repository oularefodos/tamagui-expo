import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { TamaguiProvider } from "tamagui";

// 1. Import your "Kept" Hook
import { useColorScheme } from "@/hooks/use-color-scheme";

// 2. Import your New Config
import config from "../tamagui.config";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();

    const [loaded] = useFonts({
        Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
        InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) return null;

    return (
        // 3. Connect the Hook to Tamagui
        <TamaguiProvider config={config} defaultTheme={colorScheme ?? "light"}>
            <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
                <Slot />
            </ThemeProvider>
        </TamaguiProvider>
    );
}
