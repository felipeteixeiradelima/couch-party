import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useThemedStyles } from "@/hooks/useTheme";
import React, { useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  icon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { animationsEnabled } = useAppSettings();
  const styles = useThemedStyles(createStyles);
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const animateScale = (toValue: number) => {
    if (!animationsEnabled || disabled) {
      scaleAnim.setValue(1);
      return;
    }

    Animated.spring(scaleAnim, {
      toValue,
      friction: 7,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateScale(0.98)}
        onPressOut={() => animateScale(1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.base,
          variant === "primary" && styles.primary,
          variant === "secondary" && styles.secondary,
          variant === "danger" && styles.danger,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
        <Text
          style={[
            styles.label,
            variant === "secondary" && styles.secondaryLabel,
            variant === "danger" && styles.dangerLabel,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    base: {
      minHeight: 54,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    danger: {
      backgroundColor: colors.dangerSoft,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    pressed: {
      opacity: 0.86,
    },
    disabled: {
      opacity: 0.45,
    },
    iconContainer: {
      marginRight: SPACING.sm,
    },
    label: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryLabel: {
      color: colors.textPrimary,
    },
    dangerLabel: {
      color: colors.danger,
    },
  });
