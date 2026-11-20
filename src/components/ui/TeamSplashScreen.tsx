import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

const LOGO_DARK = require("../../../assets/team-logo-dark.png");
const LOGO_LIGHT = require("../../../assets/team-logo-light.png");

const MIN_DISPLAY_DURATION_MS = 1500;
const ENTRANCE_DURATION_MS = 360;
const EXIT_DURATION_MS = 320;
const NATIVE_HIDE_FALLBACK_MS = 150;

interface TeamSplashScreenProps {
  isAppReady: boolean;
  onReadyToDisplay?: () => void;
  onFinish: () => void;
}

/**
 * Full-screen launch splash showing the Couch Party Team logo over a subtle
 * theme-aware gradient before revealing the app navigation stack.
 */
export function TeamSplashScreen({
  isAppReady,
  onReadyToDisplay,
  onFinish,
}: TeamSplashScreenProps) {
  const theme = useTheme();
  const { animationsEnabled } = useAppSettings();
  const { width } = useWindowDimensions();

  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const [containerOpacity] = useState(() => new Animated.Value(1));
  const [logoScale] = useState(
    () => new Animated.Value(animationsEnabled ? 0.94 : 1),
  );

  const hasLaidOutRef = useRef(false);
  const hasImageLoadedRef = useRef(false);
  const hasNotifiedDisplayRef = useRef(false);
  const hasStartedExitRef = useRef(false);
  const hasFinishedRef = useRef(false);
  const exitAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const logoSize = Math.max(180, Math.min(width * 0.62, 260));
  const logoSource = theme.isDark ? LOGO_DARK : LOGO_LIGHT;

  const notifyReadyToDisplay = useCallback(() => {
    if (hasNotifiedDisplayRef.current) {
      return;
    }
    hasNotifiedDisplayRef.current = true;
    onReadyToDisplay?.();
  }, [onReadyToDisplay]);

  const finishSplash = useCallback(() => {
    if (hasFinishedRef.current) {
      return;
    }
    hasFinishedRef.current = true;
    onFinish();
  }, [onFinish]);

  const handleContainerLayout = useCallback(() => {
    hasLaidOutRef.current = true;
    if (hasImageLoadedRef.current) {
      notifyReadyToDisplay();
    }
  }, [notifyReadyToDisplay]);

  const handleImageLoad = useCallback(() => {
    hasImageLoadedRef.current = true;
    if (hasLaidOutRef.current) {
      notifyReadyToDisplay();
    }
  }, [notifyReadyToDisplay]);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      notifyReadyToDisplay();
    }, NATIVE_HIDE_FALLBACK_MS);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [notifyReadyToDisplay]);

  useEffect(() => {
    const durationTimer = setTimeout(() => {
      setMinDurationElapsed(true);
    }, MIN_DISPLAY_DURATION_MS);

    return () => {
      clearTimeout(durationTimer);
    };
  }, []);

  useEffect(() => {
    if (!animationsEnabled) {
      logoScale.setValue(1);
      return;
    }

    const entranceAnimation = Animated.timing(logoScale, {
      toValue: 1,
      duration: ENTRANCE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    entranceAnimation.start();

    return () => {
      entranceAnimation.stop();
    };
  }, [animationsEnabled, logoScale]);

  useEffect(() => {
    if (!isAppReady || !minDurationElapsed || hasStartedExitRef.current) {
      return;
    }

    hasStartedExitRef.current = true;
    setIsExiting(true);

    if (!animationsEnabled) {
      finishSplash();
      return;
    }

    const exitAnimation = Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: EXIT_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1.03,
        duration: EXIT_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    exitAnimationRef.current = exitAnimation;
    exitAnimation.start(({ finished }) => {
      if (finished) {
        finishSplash();
      }
    });
  }, [
    animationsEnabled,
    containerOpacity,
    finishSplash,
    isAppReady,
    logoScale,
    minDurationElapsed,
  ]);

  useEffect(() => {
    return () => {
      exitAnimationRef.current?.stop();
    };
  }, []);

  return (
    <Animated.View
      onLayout={handleContainerLayout}
      pointerEvents={isExiting ? "none" : "auto"}
      style={[
        styles.overlay,
        {
          backgroundColor: theme.colors.background,
          opacity: containerOpacity,
        },
      ]}
    >
      <LinearGradient
        colors={theme.splashGradient}
        locations={[0, 0.5, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.centerContent}>
          <Animated.View
            accessible
            accessibilityRole="image"
            accessibilityLabel="Logo do Couch Party Team"
            style={{ transform: [{ scale: logoScale }] }}
          >
            <Image
              source={logoSource}
              onLoad={handleImageLoad}
              resizeMode="contain"
              style={{ width: logoSize, height: logoSize }}
            />
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
