import { createAnimations } from "@tamagui/animations-react-native";
import { createInterFont } from "@tamagui/font-inter";

export const animations = createAnimations({
    bouncy: {
        type: "spring",
        damping: 10,
        mass: 0.9,
        stiffness: 100,
    },
    lazy: {
        type: "spring",
        damping: 20,
        stiffness: 60,
    },
    quick: {
        type: "spring",
        damping: 20,
        mass: 1.2,
        stiffness: 250,
    },
}) as any;

// 2. TYPOGRAPHY
export const headingFont = createInterFont({
    size: { 1: 14, 2: 18, 3: 22, 4: 26, 5: 32, 6: 42, 7: 56 },
    transform: { 6: "uppercase", 7: "none" },
    weight: { 1: "400", 2: "700" },
    face: { 400: { normal: "Inter" }, 700: { normal: "InterBold" } },
});

export const bodyFont = createInterFont(
    {
        face: { 400: { normal: "Inter" }, 700: { normal: "InterBold" } },
    },
    {
        sizeSize: (size) => Math.round(size * 1.1),
        sizeLineHeight: (size) =>
            Math.round(size * 1.1 + (size > 20 ? 10 : 10)),
    }
);

// 3. THE PALETTE
export const palette = {
    slate0: "#F8FAFC",
    slate1: "#F1F5F9",
    slate2: "#E2E8F0",
    slate3: "#CBD5E1",
    slate4: "#94A3B8",
    slate5: "#64748B",
    slate6: "#475569",
    slate7: "#334155",
    slate8: "#1E293B",
    slate9: "#0F172A",

    midnight0: "#0B0C10",
    midnight1: "#15171E",
    midnight2: "#1F2937",

    indigoLight: "#818CF8",
    indigoMain: "#6366F1",
    indigoDark: "#4F46E5",
    indigoDeep: "#4338CA",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#F43F5E",
};
