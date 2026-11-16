import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@couch-party/app-settings:v1";

export interface AppSettings {
  animationsEnabled: boolean;
  hapticsEnabled: boolean;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  animationsEnabled: true,
  hapticsEnabled: true,
};

export interface AppSettingsContextValue extends AppSettings {
  isHydrated: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  toggleAnimations: () => void;
  toggleHaptics: () => void;
}

export const AppSettingsContext = createContext<AppSettingsContextValue | null>(
  null,
);

function parseStoredSettings(raw: string | null): AppSettings {
  if (!raw) {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return DEFAULT_APP_SETTINGS;
    }

    const record = parsed as Record<string, unknown>;
    return {
      animationsEnabled:
        typeof record.animationsEnabled === "boolean"
          ? record.animationsEnabled
          : DEFAULT_APP_SETTINGS.animationsEnabled,
      hapticsEnabled:
        typeof record.hapticsEnabled === "boolean"
          ? record.hapticsEnabled
          : DEFAULT_APP_SETTINGS.hapticsEnabled,
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

interface AppSettingsProviderProps {
  children: React.ReactNode;
}

export function AppSettingsProvider({ children }: AppSettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted) {
          setSettings(parseStoredSettings(stored));
        }
      } catch {
        // Fall back to default preferences if local storage is unavailable.
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistSettings = useCallback((nextSettings: AppSettings) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings)).catch(
      () => {
        // Ignore storage write errors so UI updates remain responsive.
      },
    );
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: AppSettings) => AppSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        persistSettings(next);
        return next;
      });
    },
    [persistSettings],
  );

  const setAnimationsEnabled = useCallback(
    (enabled: boolean) => {
      updateSettings((prev) =>
        prev.animationsEnabled === enabled
          ? prev
          : { ...prev, animationsEnabled: enabled },
      );
    },
    [updateSettings],
  );

  const setHapticsEnabled = useCallback(
    (enabled: boolean) => {
      updateSettings((prev) =>
        prev.hapticsEnabled === enabled
          ? prev
          : { ...prev, hapticsEnabled: enabled },
      );
    },
    [updateSettings],
  );

  const toggleAnimations = useCallback(() => {
    updateSettings((prev) => ({
      ...prev,
      animationsEnabled: !prev.animationsEnabled,
    }));
  }, [updateSettings]);

  const toggleHaptics = useCallback(() => {
    updateSettings((prev) => ({
      ...prev,
      hapticsEnabled: !prev.hapticsEnabled,
    }));
  }, [updateSettings]);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      animationsEnabled: settings.animationsEnabled,
      hapticsEnabled: settings.hapticsEnabled,
      isHydrated,
      setAnimationsEnabled,
      setHapticsEnabled,
      toggleAnimations,
      toggleHaptics,
    }),
    [
      settings.animationsEnabled,
      settings.hapticsEnabled,
      isHydrated,
      setAnimationsEnabled,
      setHapticsEnabled,
      toggleAnimations,
      toggleHaptics,
    ],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}
