export const COLORS = {
  background: "#111017",
  surface: "#1B1A24",
  surfaceElevated: "#242230",
  border: "#2D2B3A",
  borderSubtle: "#232130",
  primary: "#8B3DFF",
  primaryPressed: "#762EE6",
  primarySoft: "rgba(139, 61, 255, 0.16)",
  primaryText: "#A78BFA",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  danger: "#F43F5E",
  dangerSoft: "rgba(244, 63, 94, 0.16)",
  success: "#10B981",
  successSoft: "rgba(16, 185, 129, 0.16)",
  warning: "#F59E0B",
  warningSoft: "rgba(245, 158, 11, 0.16)",
  info: "#3B82F6",
  infoSoft: "rgba(59, 130, 246, 0.16)",
  white: "#FFFFFF",
} as const;

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

export const CIDADE_DORME_THEMES = {
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
  },
} as const;
