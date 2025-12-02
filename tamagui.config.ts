import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { tokens } from '@tamagui/themes';
import { createAnimations } from '@tamagui/animations-react-native';

// 1. ANIMATIONS
const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
}) as any;

// 2. TYPOGRAPHY
const headingFont = createInterFont({
  size: { 1: 14, 2: 18, 3: 22, 4: 26, 5: 32, 6: 42, 7: 56 },
  transform: { 6: 'uppercase', 7: 'none' },
  weight: { 1: '400', 2: '700' },
  face: { 400: { normal: 'Inter' }, 700: { normal: 'InterBold' } },
});

const bodyFont = createInterFont(
  {
    face: { 400: { normal: 'Inter' }, 700: { normal: 'InterBold' } },
  },
  {
    sizeSize: (size) => Math.round(size * 1.1),
    sizeLineHeight: (size) => Math.round(size * 1.1 + (size > 20 ? 10 : 10)),
  }
);

// 3. THE PALETTE
const palette = {
  slate0: '#F8FAFC',
  slate1: '#F1F5F9',
  slate2: '#E2E8F0',
  slate3: '#CBD5E1',
  slate4: '#94A3B8',
  slate5: '#64748B',
  slate6: '#475569',
  slate7: '#334155',
  slate8: '#1E293B',
  slate9: '#0F172A',

  midnight0: '#0B0C10',
  midnight1: '#15171E',
  midnight2: '#1F2937',

  indigoLight: '#818CF8',
  indigoMain:  '#6366F1',
  indigoDark:  '#4F46E5',
  indigoDeep:  '#4338CA',

  success: '#10B981',
  warning: '#F59E0B',
  error:   '#F43F5E',
};

// 4. CONFIGURATION
const config = createTamagui({
  animations,
  defaultTheme: 'dark',
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  tokens,
  themes: {
    dark: {
      background: palette.midnight0,
      backgroundStrong: palette.midnight1,
      backgroundSoft: palette.midnight2,
      backgroundTransparent: 'rgba(11, 12, 16, 0.8)',
      
      backgroundHover: palette.midnight1,
      backgroundPress: palette.midnight2,
      backgroundFocus: palette.midnight2,

      color: palette.slate2,
      colorHover: palette.slate0,
      colorPress: palette.slate4,
      colorFocus: palette.indigoLight,
      
      borderColor: palette.slate8,
      borderColorHover: palette.slate7,
      // --- ADDED MISSING TOKENS ---
      borderColorPress: palette.slate6, // Lighter border on press
      borderColorFocus: palette.indigoMain, // Active focus state
      // ----------------------------
      
      placeholderColor: palette.slate5,
      
      primary: palette.indigoMain,
      primaryHover: palette.indigoDark,
      primaryPress: palette.indigoDeep,
      primaryText: '#FFFFFF',
      
      success: palette.success,
      error: palette.error,
      warning: palette.warning,
    },
    
    light: {
      background: '#FFFFFF',
      backgroundStrong: palette.slate0,
      backgroundSoft: palette.slate1,
      backgroundTransparent: 'rgba(255, 255, 255, 0.8)',
      
      backgroundHover: palette.slate0,
      backgroundPress: palette.slate1,
      backgroundFocus: palette.slate1,

      color: palette.slate9,
      colorHover: palette.slate7,
      colorPress: palette.slate5,
      colorFocus: palette.indigoDark,
      
      borderColor: palette.slate2,
      borderColorHover: palette.slate3,
      // --- ADDED MISSING TOKENS ---
      borderColorPress: palette.slate4, // Darker border on press
      borderColorFocus: palette.indigoMain,
      // ----------------------------

      placeholderColor: palette.slate4,
      
      primary: palette.indigoDark,
      primaryHover: palette.indigoDeep,
      primaryPress: palette.midnight0,
      primaryText: '#FFFFFF',

      success: palette.success,
      error: palette.error,
      warning: palette.warning,
    },
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;