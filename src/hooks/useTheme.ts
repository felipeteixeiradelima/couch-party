import { AppTheme, getTheme } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useMemo } from "react";

/**
 * Returns the resolved color and style tokens for the active app theme.
 */
export function useTheme(): AppTheme {
  const { resolvedTheme } = useAppSettings();
  return useMemo(() => getTheme(resolvedTheme), [resolvedTheme]);
}

/**
 * Memoizes a theme-driven StyleSheet factory so styles recompute only on theme changes.
 */
export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
