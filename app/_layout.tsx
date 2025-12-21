import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { TamaguiProvider } from "tamagui";

// 1. Import your "Kept" Hook
import { useColorScheme } from "@/hooks/use-color-scheme";

// 2. Import your New Config
import config from "../tamagui.config";

// 3. Import database initialization
import { initDatabase } from "@/lib/db";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [dbReady, setDbReady] = useState(false);

    const [loaded] = useFonts({
        Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
        InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
    });

    // Initialize database
    useEffect(() => {
        initDatabase()
            .then(() => {
                console.log("Database initialized");
                setDbReady(true);
            })
            .catch((error) => {
                console.error("Failed to initialize database:", error);
                // Still set ready to true to prevent blocking the app
                setDbReady(true);
            });
    }, []);

    useEffect(() => {
        if (loaded && dbReady) {
            SplashScreen.hideAsync();
        }
    }, [loaded, dbReady]);

    if (!loaded || !dbReady) return null;

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
