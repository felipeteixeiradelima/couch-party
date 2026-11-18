import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightSlot,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightSlot}>{rightSlot}</View>
    </View>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      gap: SPACING.md,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.75,
    },
    titleBlock: {
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    rightSlot: {
      minWidth: 44,
      alignItems: "flex-end",
    },
  });
