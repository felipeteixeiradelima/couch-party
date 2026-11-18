import { AnimatedPhaseView } from "@/components/ui/AnimatedPhaseView";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { AppTheme, RADIUS, SPACING, ThemePreference } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
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

interface ThemeOptionConfig {
  value: ThemePreference;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  unavailableBadge?: string;
}

export default function SettingsScreen() {
  const {
    animationsEnabled,
    hapticsEnabled,
    effectiveThemePreference,
    systemTheme,
    isSystemThemeAvailable,
    setAnimationsEnabled,
    setHapticsEnabled,
    setThemePreference,
  } = useAppSettings();
  const { triggerSelection } = useHaptics();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

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

  const handleSelectTheme = (preference: ThemePreference) => {
    if (preference === "system" && !isSystemThemeAvailable) {
      return;
    }
    setThemePreference(preference);
    triggerSelection();
  };

  const systemThemeLabel =
    systemTheme === "light" ? "claro" : systemTheme === "dark" ? "escuro" : "";

  const themeOptions: ThemeOptionConfig[] = [
    {
      value: "system",
      label: "Padrão do dispositivo",
      description: isSystemThemeAvailable
        ? `Acompanha o sistema (atualmente ${systemThemeLabel}).`
        : "Não disponível neste dispositivo. Modo escuro ativo como padrão.",
      icon: "phone-portrait-outline",
      disabled: !isSystemThemeAvailable,
      unavailableBadge: !isSystemThemeAvailable ? "Indisponível" : undefined,
    },
    {
      value: "dark",
      label: "Escuro",
      description: "Visual noturno confortável para ambientes com pouca luz.",
      icon: "moon-outline",
    },
    {
      value: "light",
      label: "Claro",
      description: "Visual claro e nítido para ambientes bem iluminados.",
      icon: "sunny-outline",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Configurações"
        subtitle="Tema, animações e vibrações do app"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedPhaseView variant="fade-up">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aparência</Text>

            <View style={styles.card}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox} accessible={false}>
                  <Ionicons
                    name="color-palette-outline"
                    size={20}
                    color={colors.primaryText}
                  />
                </View>

                <View style={styles.labelBlock}>
                  <Text style={styles.optionTitle}>Tema do aplicativo</Text>
                  <Text style={styles.optionDescription}>
                    Escolha o visual do app ou siga a aparência do seu aparelho.
                  </Text>
                </View>
              </View>

              <View
                style={styles.themeOptionsList}
                accessibilityRole="radiogroup"
                accessibilityLabel="Tema do aplicativo"
              >
                {themeOptions.map((option) => {
                  const isDisabled = Boolean(option.disabled);
                  const isSelected =
                    !isDisabled && effectiveThemePreference === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSelectTheme(option.value)}
                      disabled={isDisabled}
                      accessibilityRole="radio"
                      accessibilityLabel={option.label}
                      accessibilityHint={option.description}
                      accessibilityState={{
                        selected: isSelected,
                        disabled: isDisabled,
                      }}
                      style={({ pressed }) => [
                        styles.themeOptionRow,
                        isSelected && styles.themeOptionRowSelected,
                        isDisabled && styles.themeOptionRowDisabled,
                        pressed && !isDisabled && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.themeOptionIconBox,
                          isSelected && styles.themeOptionIconBoxSelected,
                        ]}
                        accessible={false}
                      >
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={
                            isSelected
                              ? colors.primaryText
                              : colors.textSecondary
                          }
                        />
                      </View>

                      <View style={styles.themeOptionTextBlock}>
                        <View style={styles.themeOptionTitleRow}>
                          <Text
                            style={[
                              styles.themeOptionTitle,
                              isSelected && styles.themeOptionTitleSelected,
                            ]}
                          >
                            {option.label}
                          </Text>

                          {option.unavailableBadge ? (
                            <View style={styles.unavailableBadge}>
                              <Text style={styles.unavailableBadgeText}>
                                {option.unavailableBadge}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={styles.themeOptionDescription}>
                          {option.description}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected,
                        ]}
                        accessible={false}
                      >
                        {isSelected ? <View style={styles.radioInner} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {!isSystemThemeAvailable ? (
                <View style={styles.fallbackNotice}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.warning}
                  />
                  <Text style={styles.fallbackNoticeText}>
                    O tema padrão do dispositivo não está disponível neste
                    aparelho. O modo escuro está sendo usado como padrão.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </AnimatedPhaseView>

        <AnimatedPhaseView variant="fade-up" delay={50}>
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
                      color={colors.primaryText}
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
                    false: colors.switchTrackOff,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
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
                      color={colors.primaryText}
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
                    false: colors.switchTrackOff,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
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
                        color={colors.warning}
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
                        color={colors.info}
                      />
                      <Text style={styles.testChipText}>Noite (longa)</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </AnimatedPhaseView>

        <AnimatedPhaseView variant="fade-up" delay={90}>
          <View style={styles.infoBanner}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={colors.primaryText}
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

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.1,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    labelBlock: {
      flex: 1,
    },
    optionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    optionDescription: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 3,
    },
    themeOptionsList: {
      gap: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      paddingTop: SPACING.md,
    },
    themeOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      minHeight: 58,
    },
    themeOptionRowSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    themeOptionRowDisabled: {
      opacity: 0.55,
    },
    themeOptionIconBox: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    themeOptionIconBoxSelected: {
      borderColor: colors.primaryBorder,
    },
    themeOptionTextBlock: {
      flex: 1,
      gap: 2,
    },
    themeOptionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: SPACING.xs,
    },
    themeOptionTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    themeOptionTitleSelected: {
      color: colors.primaryText,
    },
    unavailableBadge: {
      backgroundColor: colors.warningSoft,
      borderWidth: 1,
      borderColor: colors.warningBorder,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
    },
    unavailableBadgeText: {
      color: colors.warning,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    themeOptionDescription: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: RADIUS.full,
      borderWidth: 2,
      borderColor: colors.textMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOuterSelected: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: RADIUS.full,
      backgroundColor: colors.primary,
    },
    fallbackNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.sm,
      backgroundColor: colors.warningSoft,
      borderWidth: 1,
      borderColor: colors.warningBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
    },
    fallbackNoticeText: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 12,
      lineHeight: 18,
    },
    testBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      paddingTop: SPACING.md,
      gap: SPACING.sm,
    },
    testLabel: {
      color: colors.textMuted,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      minHeight: 38,
    },
    testChipText: {
      color: colors.textPrimary,
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
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
    },
    infoText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
  });
