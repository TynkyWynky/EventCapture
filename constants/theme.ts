import { Platform } from 'react-native';

const primary = '#f47b20';
const primaryDark = '#cb5e12';
const accent = '#0f766e';
const success = '#2fbf71';
const danger = '#e45b5b';

export const Colors = {
  light: {
    text: '#191512',
    background: '#f6efe7',
    tint: primary,
    tintDark: primaryDark,
    accent,
    success,
    danger,
    muted: '#81776f',
    card: '#fffaf5',
    surface: '#efe3d5',
    border: '#ead7c2',
    panel: '#231b17',
    icon: '#81776f',
    tabIconDefault: '#81776f',
    tabIconSelected: primary,
  },
  dark: {
    text: '#f7f1eb',
    background: '#18110e',
    tint: primary,
    tintDark: primaryDark,
    accent,
    success,
    danger,
    muted: '#b8ada5',
    card: '#261d19',
    surface: '#342822',
    border: '#44352d',
    panel: '#f6ebe0',
    icon: '#b8ada5',
    tabIconDefault: '#b8ada5',
    tabIconSelected: primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Trebuchet MS', 'Avenir Next', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
