import { AnimatedPhaseView } from "@/components/ui/AnimatedPhaseView";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useHaptics } from "@/hooks/useHaptics";
import {
  playDayTransitionHaptic,
  playNightTransitionHaptic,
  playSelectionHaptic,
} from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const {
    animationsEnabled,
    hapticsEnabled,
    setAnimationsEnabled,
    setHapticsEnabled,
  } = useAppSettings();
  const { triggerSelection } = useHaptics();

  const handleToggleAnimations = (value: boolean) => {
    setAnimationsEnabled(value);
    triggerSelection();
  };

  const handleToggleHaptics = (value: boolean) => {
    setHapticsEnabled(value);
    if (value) {
      playSelectionHaptic();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Configurações"
        subtitle="Animações e vibrações do app"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedPhaseView variant="fade-up">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experiência e retorno</Text>

            {/* Animations toggle */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBox} accessible={false}>
                    <Ionicons
                      name="sparkles-outline"
                      size={20}
                      color={COLORS.primaryText}
                    />
                  </View>

                  <View style={styles.labelBlock}>
                    <Text style={styles.optionTitle}>Animações</Text>
                    <Text style={styles.optionDescription}>
                      Ativa transições entre telas, troca de fases e revelação e
                      ocultação de cartas.
                    </Text>
                  </View>
                </View>

                <Switch
                  value={animationsEnabled}
                  onValueChange={handleToggleAnimations}
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primary,
                  }}
                  thumbColor={COLORS.white}
                  accessibilityLabel="Habilitar animações"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: animationsEnabled }}
                />
              </View>
            </View>

            {/* Haptics toggle */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBox} accessible={false}>
                    <Ionicons
                      name="phone-portrait-outline"
                      size={20}
                      color={COLORS.primaryText}
                    />
                  </View>

                  <View style={styles.labelBlock}>
                    <Text style={styles.optionTitle}>
                      Vibrações do dispositivo
                    </Text>
                    <Text style={styles.optionDescription}>
                      Ativa feedback tátil em cartas, seleções, resultados e
                      transições de dia e noite no Cidade Dorme.
                    </Text>
                  </View>
                </View>

                <Switch
                  value={hapticsEnabled}
                  onValueChange={handleToggleHaptics}
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primary,
                  }}
                  thumbColor={COLORS.white}
                  accessibilityLabel="Habilitar vibrações do dispositivo"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hapticsEnabled }}
                />
              </View>

              {hapticsEnabled ? (
                <View style={styles.testBlock}>
                  <Text style={styles.testLabel}>Testar vibrações</Text>
                  <View style={styles.testRow}>
                    <Pressable
                      onPress={playDayTransitionHaptic}
                      accessibilityRole="button"
                      accessibilityLabel="Testar vibração curta do dia"
                      style={({ pressed }) => [
                        styles.testChip,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="sunny-outline"
                        size={15}
                        color={COLORS.warning}
                      />
                      <Text style={styles.testChipText}>Dia (curta)</Text>
                    </Pressable>

                    <Pressable
                      onPress={playNightTransitionHaptic}
                      accessibilityRole="button"
                      accessibilityLabel="Testar vibração média ou longa da noite"
                      style={({ pressed }) => [
                        styles.testChip,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="moon-outline"
                        size={15}
                        color={COLORS.info}
                      />
                      <Text style={styles.testChipText}>Noite (longa)</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </AnimatedPhaseView>

        <AnimatedPhaseView variant="fade-up" delay={70}>
          <View style={styles.infoBanner}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={COLORS.primaryText}
            />
            <Text style={styles.infoText}>
              Suas preferências são salvas automaticamente e aplicadas em todos
              os jogos do aplicativo.
            </Text>
          </View>
        </AnimatedPhaseView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  labelBlock: {
    flex: 1,
  },
  optionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  optionDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  testBlock: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  testLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  testRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  testChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 38,
  },
  testChipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.78,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(139, 61, 255, 0.35)",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
