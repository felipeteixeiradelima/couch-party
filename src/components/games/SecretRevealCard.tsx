import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PRESS_RETENTION_OFFSET = { top: 40, left: 40, bottom: 40, right: 40 };

interface SecretRevealCardProps {
  cardKey: string | number;
  isHolding: boolean;
  accessibilityLabel: string;
  onPressIn: () => void;
  onPressOut: () => void;
  onTouchEnd: (event: GestureResponderEvent) => void;
  onTouchCancel: () => void;
  renderCornerIcon: (color: string) => React.ReactNode;
  revealedAccentColor: string;
  revealedBorderColor: string;
  hiddenHint: string;
  revealedContent: React.ReactNode;
}

export function SecretRevealCard({
  cardKey,
  isHolding,
  accessibilityLabel,
  onPressIn,
  onPressOut,
  onTouchEnd,
  onTouchCancel,
  renderCornerIcon,
  revealedAccentColor,
  revealedBorderColor,
  hiddenHint,
  revealedContent,
}: SecretRevealCardProps) {
  const { animationsEnabled } = useAppSettings();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [flipAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [entranceAnim] = useState(
    () => new Animated.Value(animationsEnabled ? 0 : 1),
  );
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const prevCardKeyRef = useRef(cardKey);

  // Deal-in animation whenever the active player changes.
  useEffect(() => {
    if (prevCardKeyRef.current !== cardKey) {
      prevCardKeyRef.current = cardKey;
      flipAnim.setValue(0);
      scaleAnim.setValue(1);
    }

    if (!animationsEnabled) {
      entranceAnim.setValue(1);
      return;
    }

    entranceAnim.setValue(0);
    const dealAnimation = Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    dealAnimation.start();

    return () => {
      dealAnimation.stop();
    };
  }, [animationsEnabled, cardKey, entranceAnim, flipAnim, scaleAnim]);

  // 3D card flip and press feedback on reveal / hide.
  useEffect(() => {
    if (!animationsEnabled) {
      flipAnim.setValue(isHolding ? 1 : 0);
      scaleAnim.setValue(1);
      return;
    }

    if (isHolding) {
      const revealAnimation = Animated.parallel([
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.965,
            duration: 90,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 120,
            useNativeDriver: true,
          }),
        ]),
      ]);
      revealAnimation.start();
      return () => {
        revealAnimation.stop();
      };
    }

    const hideAnimation = Animated.parallel([
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    hideAnimation.start();

    return () => {
      hideAnimation.stop();
    };
  }, [animationsEnabled, flipAnim, isHolding, scaleAnim]);

  // Subtle idle breathing pulse on the fingerprint icon while waiting.
  useEffect(() => {
    if (!animationsEnabled || isHolding) {
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [animationsEnabled, isHolding, pulseAnim]);

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  const entranceTranslateX = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });

  const shouldRenderBackContent = isHolding || animationsEnabled;

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      cancelable={false}
      pressRetentionOffset={PRESS_RETENTION_OFFSET}
      pointerEvents="box-only"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.cardPressable}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.animatedDeckWrapper,
          {
            opacity: entranceAnim,
            transform: [
              { translateX: entranceTranslateX },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Front face (hidden state) */}
        <Animated.View
          accessibilityElementsHidden={isHolding}
          importantForAccessibility={isHolding ? "no-hide-descendants" : "yes"}
          style={[
            styles.outerCard,
            styles.frontCard,
            {
              opacity: frontOpacity,
              transform: [{ perspective: 1200 }, { rotateY: frontRotateY }],
            },
          ]}
        >
          <View style={[styles.innerFrame, { borderColor: colors.border }]}>
            <View style={styles.cardTopRow}>
              {renderCornerIcon(colors.primaryText)}
              <Text style={styles.cardTag}>PAPEL SECRETO</Text>
              <View style={styles.cardCornerPlaceholder} />
            </View>

            <View style={styles.cardCenter}>
              <Animated.View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: colors.primarySoft,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
                accessible={false}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={42}
                  color={colors.primaryText}
                />
              </Animated.View>

              <Text style={styles.hiddenTitle}>Segure para revelar</Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text style={styles.hiddenHint}>{hiddenHint}</Text>
            </View>

            <View style={styles.cardBottomRow}>
              <View style={styles.cardCornerPlaceholder} />
              <Text style={styles.cardTag}>SOLTE PARA OCULTAR</Text>
              {renderCornerIcon(colors.primaryText)}
            </View>
          </View>
        </Animated.View>

        {/* Back face (revealed state) */}
        <Animated.View
          accessibilityElementsHidden={!isHolding}
          importantForAccessibility={isHolding ? "yes" : "no-hide-descendants"}
          style={[
            styles.outerCard,
            styles.outerCardPressed,
            StyleSheet.absoluteFill,
            {
              borderColor: revealedBorderColor,
              opacity: backOpacity,
              transform: [{ perspective: 1200 }, { rotateY: backRotateY }],
            },
          ]}
        >
          <View
            style={[styles.innerFrame, { borderColor: revealedBorderColor }]}
          >
            <View style={styles.cardTopRow}>
              {renderCornerIcon(revealedAccentColor)}
              <Text style={styles.cardTag}>PAPEL SECRETO</Text>
              <View style={styles.cardCornerPlaceholder} />
            </View>

            <View style={styles.cardCenter}>
              {shouldRenderBackContent ? revealedContent : null}
            </View>

            <View style={styles.cardBottomRow}>
              <View style={styles.cardCornerPlaceholder} />
              <Text style={styles.cardTag}>GUARDE SEU SEGREDO</Text>
              {renderCornerIcon(revealedAccentColor)}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    cardPressable: {
      flex: 1,
      maxHeight: 460,
    },
    animatedDeckWrapper: {
      flex: 1,
      position: "relative",
    },
    outerCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: 10,
      backfaceVisibility: "hidden",
    },
    frontCard: {
      borderColor: colors.border,
    },
    outerCardPressed: {
      backgroundColor: colors.surfaceElevated,
    },
    innerFrame: {
      flex: 1,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      padding: SPACING.lg,
      justifyContent: "space-between",
    },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardBottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardCornerPlaceholder: {
      width: 18,
    },
    cardTag: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.6,
    },
    cardCenter: {
      alignItems: "center",
      paddingHorizontal: SPACING.sm,
    },
    iconCircle: {
      width: 84,
      height: 84,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.lg,
    },
    hiddenTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      textAlign: "center",
    },
    dividerLine: {
      width: 32,
      height: 3,
      borderRadius: RADIUS.full,
      marginVertical: SPACING.md,
    },
    hiddenHint: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      maxWidth: 260,
    },
  });
