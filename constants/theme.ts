import { Platform } from 'react-native';

const Palette = {
  cream0: '#fdfbf8',
  cream50: '#fcfaf7',
  cream100: '#f8f5f1',
  cream150: '#f4eee8',
  cream200: '#efe7df',
  cream300: '#e7ddd2',
  cream400: '#d9ccbf',
  stone500: '#8f8175',
  stone600: '#6f6257',
  stone700: '#4b4038',
  ink900: '#1f1a17',
  orange500: '#f47b20',
  orange600: '#cb5e12',
  teal500: '#0f766e',
  teal600: '#0d5d57',
  blue500: '#4a6c87',
  red500: '#e45b5b',
  green500: '#2fbf71',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  round: 999,
} as const;

export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

export const Typography = {
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  titleLg: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
  titleMd: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  titleSm: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  bodySm: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  button: {
    fontSize: 15,
    fontWeight: '800',
  },
} as const;

export const Layout = {
  screenPadding: Spacing.lg,
  sectionGap: Spacing.lg,
  bottomPad: 152,
  heroRadius: Radius.xxl,
  tabBarInset: 14,
} as const;

export const Colors = {
  light: {
    text: Palette.ink900,
    title: Palette.ink900,
    subtitle: Palette.stone500,
    background: Palette.cream100,
    canvas: Palette.cream50,
    tint: Palette.orange500,
    tintDark: Palette.orange600,
    accent: Palette.teal500,
    accentDark: Palette.teal600,
    success: Palette.green500,
    danger: Palette.red500,
    muted: Palette.stone500,
    card: '#ffffff',
    cardSubtle: Palette.cream50,
    cardFeature: Palette.cream150,
    surface: Palette.cream200,
    border: Palette.cream300,
    borderStrong: Palette.cream400,
    panel: Palette.ink900,
    panelSoft: '#2d241f',
    overlay: 'rgba(31, 26, 23, 0.08)',
    scrim: 'rgba(18, 12, 8, 0.28)',
    inputBackground: '#ffffff',
    icon: Palette.stone500,
    tabIconDefault: Palette.stone500,
    tabIconSelected: Palette.orange500,
    shadow: '#000',
  },
  dark: {
    text: '#f7f1eb',
    title: '#f7f1eb',
    subtitle: '#cbbfb6',
    background: '#18110e',
    canvas: '#1d1512',
    tint: Palette.orange500,
    tintDark: Palette.orange600,
    accent: Palette.teal500,
    accentDark: Palette.teal600,
    success: Palette.green500,
    danger: Palette.red500,
    muted: '#b8ada5',
    card: '#261d19',
    cardSubtle: '#211915',
    cardFeature: '#2d241f',
    surface: '#342822',
    border: '#44352d',
    borderStrong: '#56453c',
    panel: '#f6ebe0',
    panelSoft: '#ead8ca',
    overlay: 'rgba(255, 255, 255, 0.08)',
    scrim: 'rgba(0, 0, 0, 0.36)',
    inputBackground: '#2b211d',
    icon: '#b8ada5',
    tabIconDefault: '#b8ada5',
    tabIconSelected: Palette.orange500,
    shadow: '#000',
  },
};

export type TabRouteName =
  | 'index'
  | 'events'
  | 'camera'
  | 'socialfeed'
  | 'achievements'
  | 'profile';

export const TabThemes: Record<
  TabRouteName,
  {
    accent: string;
    accentDark: string;
    surface: string;
    background: string;
    panel: string;
  }
> = {
  index: {
    accent: Palette.orange500,
    accentDark: Palette.orange600,
    surface: Colors.light.card,
    background: Colors.light.background,
    panel: Colors.light.panel,
  },
  events: {
    accent: '#157a74',
    accentDark: '#0f5a57',
    surface: Colors.light.card,
    background: '#f6faf9',
    panel: '#163e3a',
  },
  camera: {
    accent: Palette.orange500,
    accentDark: Palette.orange600,
    surface: Colors.light.card,
    background: Colors.light.background,
    panel: Colors.light.panel,
  },
  socialfeed: {
    accent: '#d25d4a',
    accentDark: '#a23c2d',
    surface: Colors.light.card,
    background: '#faf5f3',
    panel: '#361916',
  },
  achievements: {
    accent: '#c8891c',
    accentDark: '#8e5f10',
    surface: Colors.light.card,
    background: '#fbf7ef',
    panel: '#3a2816',
  },
  profile: {
    accent: Palette.blue500,
    accentDark: '#2d4760',
    surface: Colors.light.card,
    background: '#f4f7fa',
    panel: '#1f2b37',
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
