import {
  AppSettingsContext,
  AppSettingsContextValue,
} from "@/contexts/AppSettingsContext";
import { useContext } from "react";

/**
 * Accesses the global app preferences (animations and haptics toggles).
 */
export function useAppSettings(): AppSettingsContextValue {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error(
      "useAppSettings must be used within an AppSettingsProvider",
    );
  }

  return context;
}
