import { createTamagui } from 'tamagui';
import { shorthands } from '@tamagui/shorthands';
import { tokens } from '@tamagui/themes';
import { animations, bodyFont, headingFont, palette } from './theme';

// 4. CONFIGURATION
const config = createTamagui({
  animations: animations,
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