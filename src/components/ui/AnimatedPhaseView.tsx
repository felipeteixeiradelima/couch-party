import { useAppSettings } from "@/hooks/useAppSettings";
import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";

export type PhaseAnimationVariant = "fade-up" | "slide-right" | "pop";

interface AnimatedPhaseViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: PhaseAnimationVariant;
  delay?: number;
  duration?: number;
}

export function AnimatedPhaseView({
  children,
  style,
  variant = "fade-up",
  delay = 0,
  duration = 260,
}: AnimatedPhaseViewProps) {
  const { animationsEnabled } = useAppSettings();
  const [progress] = useState(
    () => new Animated.Value(animationsEnabled ? 0 : 1),
  );

  useEffect(() => {
    if (!animationsEnabled) {
      progress.setValue(1);
      return;
    }

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [animationsEnabled, delay, duration, progress]);

  if (!animationsEnabled) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  const animatedStyle = {
    opacity: progress,
    transform:
      variant === "slide-right"
        ? [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [22, 0],
              }),
            },
          ]
        : variant === "pop"
          ? [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ]
          : [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
  };

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}
