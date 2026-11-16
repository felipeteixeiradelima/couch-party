import { COLORS } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatTimer } from "@/utils/gameEngine";
import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

interface CircularTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
}

export function getTimerColor(
  remainingSeconds: number,
  totalSeconds: number,
): string {
  if (remainingSeconds <= 10) {
    return COLORS.danger;
  }

  const ratio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  if (remainingSeconds <= 30 || ratio <= 0.25) {
    return COLORS.warning;
  }

  return COLORS.success;
}

export function CircularTimer({
  remainingSeconds,
  totalSeconds,
  label = "Tempo de votação",
  size = 188,
  strokeWidth = 8,
}: CircularTimerProps) {
  const { animationsEnabled } = useAppSettings();
  const [pulseAnim] = useState(() => new Animated.Value(1));

  const isDangerZone = remainingSeconds > 0 && remainingSeconds <= 10;

  useEffect(() => {
    if (!animationsEnabled || !isDangerZone) {
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.035,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [animationsEnabled, isDangerZone, pulseAnim]);

  const safeTotal = Math.max(1, totalSeconds);
  const progress = Math.min(1, Math.max(0, remainingSeconds / safeTotal));
  const activeColor = getTimerColor(remainingSeconds, safeTotal);

  const halfSize = size / 2;
  const rightRotationDeg = progress >= 0.5 ? 45 : 45 - (0.5 - progress) * 360;
  const leftRotationDeg = progress <= 0.5 ? 45 : 45 + (progress - 0.5) * 360;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { width: size, height: size, transform: [{ scale: pulseAnim }] },
      ]}
      accessibilityRole="timer"
      accessibilityLabel={`${label}: ${formatTimer(remainingSeconds)}`}
    >
      {/* Background track */}
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: halfSize,
            borderWidth: strokeWidth,
          },
        ]}
      />

      {/* Right semi-circle (12 o'clock to 6 o'clock) */}
      <View
        style={[
          styles.halfClip,
          { left: halfSize, width: halfSize, height: size },
        ]}
        accessible={false}
      >
        <View
          style={[
            styles.arcRing,
            {
              width: size,
              height: size,
              left: -halfSize,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderTopColor: activeColor,
              borderRightColor: activeColor,
              transform: [{ rotate: `${rightRotationDeg}deg` }],
            },
          ]}
        />
      </View>

      {/* Left semi-circle (6 o'clock to 12 o'clock) */}
      <View
        style={[styles.halfClip, { left: 0, width: halfSize, height: size }]}
        accessible={false}
      >
        <View
          style={[
            styles.arcRing,
            {
              width: size,
              height: size,
              left: 0,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderTopColor: activeColor,
              borderRightColor: activeColor,
              transform: [{ rotate: `${leftRotationDeg}deg` }],
            },
          ]}
        />
      </View>

      {/* Center readout */}
      <View style={styles.centerContent}>
        <View style={[styles.topPill, { backgroundColor: activeColor }]} />
        <Text style={styles.timeText}>{formatTimer(remainingSeconds)}</Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  track: {
    position: "absolute",
    borderColor: COLORS.border,
  },
  halfClip: {
    position: "absolute",
    top: 0,
    overflow: "hidden",
  },
  arcRing: {
    position: "absolute",
    top: 0,
    borderColor: "transparent",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  topPill: {
    width: 14,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  timeText: {
    color: COLORS.textPrimary,
    fontSize: 40,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
  labelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
});
