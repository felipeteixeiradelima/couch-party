export type ThemePreference = "system" | "dark" | "light";
export type ResolvedTheme = "dark" | "light";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  switchTrackOff: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primaryBorder: string;
  primaryText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  danger: string;
  dangerSoft: string;
  dangerBorder: string;
  success: string;
  successSoft: string;
  successTint: string;
  successBorder: string;
  warning: string;
  warningSoft: string;
  warningBorder: string;
  info: string;
  infoSoft: string;
  infoBorder: string;
  modalBackdrop: string;
  sheetBackdrop: string;
  white: string;
}

export interface CidadeDormePhaseTheme {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  secondaryAccent: string;
  primaryButton: string;
  transitionToNightButton?: string;
}

export interface CidadeDormeThemeSet {
  night: CidadeDormePhaseTheme;
  day: CidadeDormePhaseTheme;
}

export interface AppTheme {
  mode: ResolvedTheme;
  isDark: boolean;
  colors: ThemeColors;
  splashGradient: readonly [string, string, string];
  cidadeDorme: CidadeDormeThemeSet;
  shadowOpacity: number;
}

export const DARK_COLORS: ThemeColors = {
  background: "#111017",
  surface: "#1B1A24",
  surfaceElevated: "#242230",
  border: "#2D2B3A",
  borderSubtle: "#232130",
  switchTrackOff: "#2D2B3A",
  primary: "#8B3DFF",
  primaryPressed: "#762EE6",
  primarySoft: "rgba(139, 61, 255, 0.16)",
  primaryBorder: "rgba(139, 61, 255, 0.35)",
  primaryText: "#A78BFA",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  danger: "#F43F5E",
  dangerSoft: "rgba(244, 63, 94, 0.16)",
  dangerBorder: "rgba(244, 63, 94, 0.42)",
  success: "#10B981",
  successSoft: "rgba(16, 185, 129, 0.16)",
  successTint: "rgba(16, 185, 129, 0.08)",
  successBorder: "rgba(16, 185, 129, 0.42)",
  warning: "#F59E0B",
  warningSoft: "rgba(245, 158, 11, 0.16)",
  warningBorder: "rgba(245, 158, 11, 0.38)",
  info: "#3B82F6",
  infoSoft: "rgba(59, 130, 246, 0.16)",
  infoBorder: "rgba(59, 130, 246, 0.38)",
  modalBackdrop: "rgba(8, 7, 13, 0.78)",
  sheetBackdrop: "rgba(8, 7, 13, 0.72)",
  white: "#FFFFFF",
};

export const LIGHT_COLORS: ThemeColors = {
  background: "#F5F4FA",
  surface: "#FFFFFF",
  surfaceElevated: "#ECEAF5",
  border: "#DDD9EC",
  borderSubtle: "#EAE7F4",
  switchTrackOff: "#C6C1D8",
  primary: "#7C3AED",
  primaryPressed: "#6D28D9",
  primarySoft: "rgba(124, 58, 237, 0.11)",
  primaryBorder: "rgba(124, 58, 237, 0.32)",
  primaryText: "#6D28D9",
  textPrimary: "#161424",
  textSecondary: "#524F6A",
  textMuted: "#6F6B86",
  danger: "#E11D48",
  dangerSoft: "rgba(225, 29, 72, 0.1)",
  dangerBorder: "rgba(225, 29, 72, 0.34)",
  success: "#047857",
  successSoft: "rgba(4, 120, 87, 0.11)",
  successTint: "rgba(4, 120, 87, 0.08)",
  successBorder: "rgba(4, 120, 87, 0.34)",
  warning: "#B45309",
  warningSoft: "rgba(217, 119, 6, 0.12)",
  warningBorder: "rgba(217, 119, 6, 0.34)",
  info: "#2563EB",
  infoSoft: "rgba(37, 99, 235, 0.11)",
  infoBorder: "rgba(37, 99, 235, 0.32)",
  modalBackdrop: "rgba(17, 16, 23, 0.5)",
  sheetBackdrop: "rgba(17, 16, 23, 0.44)",
  white: "#FFFFFF",
};

export const PLAYER_COLORS = [
  "#7C3AED",
  "#4F46E5",
  "#2563EB",
  "#D97706",
  "#059669",
  "#E11D48",
  "#0891B2",
  "#C026D3",
] as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const CIDADE_DORME_THEMES_DARK: CidadeDormeThemeSet = {
  night: {
    background: "#090D18",
    surface: "#11172A",
    surfaceElevated: "#18213B",
    border: "#253154",
    borderSubtle: "#1B2440",
    accent: "#60A5FA",
    accentSoft: "rgba(96, 165, 250, 0.16)",
    accentBorder: "rgba(96, 165, 250, 0.4)",
    secondaryAccent: "#818CF8",
    primaryButton: "#2563EB",
  },
  day: {
    background: "#161210",
    surface: "#211B18",
    surfaceElevated: "#2B231F",
    border: "#3F322B",
    borderSubtle: "#2E2520",
    accent: "#F59E0B",
    accentSoft: "rgba(245, 158, 11, 0.16)",
    accentBorder: "rgba(245, 158, 11, 0.42)",
    secondaryAccent: "#FB923C",
    primaryButton: "#B45309",
    transitionToNightButton: "#2563EB",
  },
};

export const CIDADE_DORME_THEMES_LIGHT: CidadeDormeThemeSet = {
  night: {
    background: "#EBF0FF",
    surface: "#F8FAFF",
    surfaceElevated: "#E1E9FE",
    border: "#C5D2F6",
    borderSubtle: "#D6E0FA",
    accent: "#1D4ED8",
    accentSoft: "rgba(37, 99, 235, 0.12)",
    accentBorder: "rgba(37, 99, 235, 0.34)",
    secondaryAccent: "#4F46E5",
    primaryButton: "#2563EB",
  },
  day: {
    background: "#FFF7E6",
    surface: "#FFFDF8",
    surfaceElevated: "#FDEECC",
    border: "#EDD6AD",
    borderSubtle: "#F4E4C6",
    accent: "#B45309",
    accentSoft: "rgba(217, 119, 6, 0.13)",
    accentBorder: "rgba(217, 119, 6, 0.36)",
    secondaryAccent: "#EA580C",
    primaryButton: "#B45309",
    transitionToNightButton: "#1D4ED8",
  },
};

export const DARK_THEME: AppTheme = {
  mode: "dark",
  isDark: true,
  colors: DARK_COLORS,
  splashGradient: ["#111017", "#1B162C", "#111017"],
  cidadeDorme: CIDADE_DORME_THEMES_DARK,
  shadowOpacity: 0.35,
};

export const LIGHT_THEME: AppTheme = {
  mode: "light",
  isDark: false,
  colors: LIGHT_COLORS,
  splashGradient: ["#F5F4FA", "#EAE4FA", "#F5F4FA"],
  cidadeDorme: CIDADE_DORME_THEMES_LIGHT,
  shadowOpacity: 0.12,
};

export function getTheme(mode: ResolvedTheme): AppTheme {
  return mode === "light" ? LIGHT_THEME : DARK_THEME;
}

export const COLORS = DARK_COLORS;
export const CIDADE_DORME_THEMES = CIDADE_DORME_THEMES_DARK;
