import { Button } from "@/components/ui/Button";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { CidadeDormeSettings } from "@/types/cidadeDorme";
import {
  clampAssassinCount,
  clampSpecialInnocentCount,
  getCitizenCount,
  getMaxAssassins,
  getMaxSpecialInnocentRole,
  normalizeCidadeDormeSettings,
} from "@/utils/cidadeDormeEngine";
import {
  clampVotingSeconds,
  formatDurationLabel,
  MAX_VOTING_SECONDS,
  MIN_VOTING_SECONDS,
  VOTING_PRESET_SECONDS,
  VOTING_STEP_SECONDS,
} from "@/utils/gameEngine";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

interface CidadeDormeSettingsModalProps {
  visible: boolean;
  settings: CidadeDormeSettings;
  playerCount: number;
  onSave: (nextSettings: CidadeDormeSettings) => void;
  onClose: () => void;
}

export function CidadeDormeSettingsModal(props: CidadeDormeSettingsModalProps) {
  const { visible, onClose } = props;
  const { animationsEnabled } = useAppSettings();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationsEnabled ? "slide" : "none"}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {visible ? <CidadeDormeSettingsContent {...props} /> : null}
    </Modal>
  );
}

function CidadeDormeSettingsContent({
  settings,
  playerCount,
  onSave,
  onClose,
}: CidadeDormeSettingsModalProps) {
  const [draft, setDraft] = useState<CidadeDormeSettings>(() =>
    normalizeCidadeDormeSettings(settings, playerCount),
  );

  const safePlayerCount = Math.max(2, playerCount);
  const maxAssassins = getMaxAssassins(safePlayerCount);
  const maxSpecialInnocentRole = getMaxSpecialInnocentRole(safePlayerCount);
  const citizenCount = getCitizenCount(draft, safePlayerCount);
  const hasAssassinMajorityStart =
    draft.assassinCount >= Math.ceil(safePlayerCount / 2);

  const handleChangeAssassins = (delta: number) => {
    setDraft((prev) =>
      normalizeCidadeDormeSettings(
        {
          ...prev,
          assassinCount: clampAssassinCount(
            prev.assassinCount + delta,
            safePlayerCount,
          ),
        },
        safePlayerCount,
      ),
    );
  };

  const handleChangeSpecialRole = (
    roleKey: "detectiveCount" | "guardianAngelCount",
    delta: number,
  ) => {
    setDraft((prev) => {
      const otherRoleKey =
        roleKey === "detectiveCount" ? "guardianAngelCount" : "detectiveCount";
      const nextValue = clampSpecialInnocentCount(
        prev[roleKey] + delta,
        safePlayerCount,
      );
      const overflow =
        prev.assassinCount + prev[otherRoleKey] + nextValue - safePlayerCount;
      const nextAssassins =
        overflow > 0
          ? Math.max(1, prev.assassinCount - overflow)
          : prev.assassinCount;

      return normalizeCidadeDormeSettings(
        {
          ...prev,
          assassinCount: nextAssassins,
          [roleKey]: nextValue,
        },
        safePlayerCount,
      );
    });
  };

  const handleChangeVotingDuration = (delta: number) => {
    setDraft((prev) => ({
      ...prev,
      votingDurationSeconds: clampVotingSeconds(
        prev.votingDurationSeconds + delta,
      ),
    }));
  };

  const handleSave = () => {
    onSave(normalizeCidadeDormeSettings(draft, safePlayerCount));
  };

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar configurações"
      />

      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Configurações da partida</Text>
            <Text style={styles.sheetSubtitle}>
              Defina os papéis e o tempo de votação
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Distribuição de papéis */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Distribuição ({safePlayerCount} jogadores)
            </Text>
            <View style={styles.summaryBadges}>
              <View style={[styles.summaryBadge, styles.assassinBadge]}>
                <Text style={styles.summaryBadgeText}>
                  {draft.assassinCount} Assassino
                  {draft.assassinCount > 1 ? "s" : ""}
                </Text>
              </View>
              <View style={[styles.summaryBadge, styles.detectiveBadge]}>
                <Text style={styles.summaryBadgeText}>
                  {draft.detectiveCount} Detetive
                  {draft.detectiveCount !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={[styles.summaryBadge, styles.angelBadge]}>
                <Text style={styles.summaryBadgeText}>
                  {draft.guardianAngelCount} Anjo
                  {draft.guardianAngelCount !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={[styles.summaryBadge, styles.citizenBadge]}>
                <Text style={styles.summaryBadgeText}>
                  {citizenCount} Cidadão{citizenCount !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {hasAssassinMajorityStart ? (
              <View style={styles.warningNote}>
                <Ionicons
                  name="warning-outline"
                  size={15}
                  color={COLORS.warning}
                />
                <Text style={styles.warningNoteText}>
                  Com {draft.assassinCount} assassinos para {safePlayerCount}{" "}
                  jogadores, eles já começam igualando ou superando os
                  inocentes.
                </Text>
              </View>
            ) : null}
          </View>

          {/* Assassinos */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.labelBlock}>
                <Text style={styles.optionTitle}>Assassinos</Text>
                <Text style={styles.optionDescription}>
                  Mínimo 1, máximo {maxAssassins} ({safePlayerCount} jogadores)
                </Text>
              </View>

              <View style={styles.stepper}>
                <Pressable
                  onPress={() => handleChangeAssassins(-1)}
                  disabled={draft.assassinCount <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Diminuir quantidade de assassinos"
                  style={({ pressed }) => [
                    styles.stepperButton,
                    draft.assassinCount <= 1 && styles.stepperDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={COLORS.textPrimary}
                  />
                </Pressable>

                <Text style={styles.stepperValue}>{draft.assassinCount}</Text>

                <Pressable
                  onPress={() => handleChangeAssassins(1)}
                  disabled={draft.assassinCount >= maxAssassins}
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar quantidade de assassinos"
                  style={({ pressed }) => [
                    styles.stepperButton,
                    draft.assassinCount >= maxAssassins &&
                      styles.stepperDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Detetive */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.labelBlock}>
                <Text style={styles.optionTitle}>Detetives</Text>
                <Text style={styles.optionDescription}>
                  Mínimo 0, máximo {maxSpecialInnocentRole} ({safePlayerCount}{" "}
                  jogadores). Investiga se um jogador é inocente ou assassino à
                  noite.
                </Text>
              </View>

              <View style={styles.stepper}>
                <Pressable
                  onPress={() => handleChangeSpecialRole("detectiveCount", -1)}
                  disabled={draft.detectiveCount <= 0}
                  accessibilityRole="button"
                  accessibilityLabel="Diminuir quantidade de detetives"
                  style={({ pressed }) => [
                    styles.stepperButton,
                    draft.detectiveCount <= 0 && styles.stepperDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={COLORS.textPrimary}
                  />
                </Pressable>

                <Text style={styles.stepperValue}>{draft.detectiveCount}</Text>

                <Pressable
                  onPress={() => handleChangeSpecialRole("detectiveCount", 1)}
                  disabled={draft.detectiveCount >= maxSpecialInnocentRole}
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar quantidade de detetives"
                  style={({ pressed }) => [
                    styles.stepperButton,
                    draft.detectiveCount >= maxSpecialInnocentRole &&
                      styles.stepperDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Anjo da Guarda */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.labelBlock}>
                <Text style={styles.optionTitle}>Anjos da Guarda</Text>
                <Text style={styles.optionDescription}>
                  Mínimo 0, máximo {maxSpecialInnocentRole} ({safePlayerCount}{" "}
                  jogadores). Protege um jogador contra o ataque noturno.
                </Text>
              </View>

              <View style={styles.stepper}>
                <Pressable
                  onPress={() =>
                    handleChangeSpecialRole("guardianAngelCount", -1)
                  }
                  disabled={draft.guardianAngelCount <= 0}
                  accessibilityRole="button"
                  accessibilityLabel="Diminuir quantidade de anjos da guarda"
                  style={({ pressed }) => [
                    styles.stepperButton,
                    draft.guardianAngelCount <= 0 && styles.stepperDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={COLORS.textPrimary}
                  />
                </Pressable>

                <Text style={styles.stepperValue}>
                  {draft.guardianAngelCount}
                </Text>

                <Pressable
                  onPress={() =>
                    handleChangeSpecialRole("guardianAngelCount", 1)
                  }
                  disabled={draft.guardianAngelCount >= maxSpecialInnocentRole}
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar quantidade de anjos da guarda"
                  style={({ pressed }) => [
                    styles.stepperButton,
                    draft.guardianAngelCount >= maxSpecialInnocentRole &&
                      styles.stepperDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Tempo de votação */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.labelBlock}>
                <Text style={styles.optionTitle}>Tempo de votação</Text>
                <Text style={styles.optionDescription}>
                  Cronômetro entre 30s e 10min durante a votação do dia.
                </Text>
              </View>

              <Switch
                value={draft.votingTimerEnabled}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    votingTimerEnabled: value,
                  }))
                }
                trackColor={{
                  false: COLORS.border,
                  true: COLORS.primary,
                }}
                thumbColor={COLORS.white}
                accessibilityLabel="Habilitar tempo de votação"
              />
            </View>

            {draft.votingTimerEnabled ? (
              <View style={styles.timerConfigBlock}>
                <View style={styles.timerStepperRow}>
                  <Pressable
                    onPress={() =>
                      handleChangeVotingDuration(-VOTING_STEP_SECONDS)
                    }
                    disabled={draft.votingDurationSeconds <= MIN_VOTING_SECONDS}
                    accessibilityRole="button"
                    accessibilityLabel="Diminuir tempo de votação em 30 segundos"
                    style={({ pressed }) => [
                      styles.durationStepButton,
                      draft.votingDurationSeconds <= MIN_VOTING_SECONDS &&
                        styles.stepperDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.durationStepText}>-30s</Text>
                  </Pressable>

                  <Text style={styles.durationValue}>
                    {formatDurationLabel(draft.votingDurationSeconds)}
                  </Text>

                  <Pressable
                    onPress={() =>
                      handleChangeVotingDuration(VOTING_STEP_SECONDS)
                    }
                    disabled={draft.votingDurationSeconds >= MAX_VOTING_SECONDS}
                    accessibilityRole="button"
                    accessibilityLabel="Aumentar tempo de votação em 30 segundos"
                    style={({ pressed }) => [
                      styles.durationStepButton,
                      draft.votingDurationSeconds >= MAX_VOTING_SECONDS &&
                        styles.stepperDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.durationStepText}>+30s</Text>
                  </Pressable>
                </View>

                <View style={styles.presetsRow}>
                  {VOTING_PRESET_SECONDS.map((preset) => {
                    const isActive = draft.votingDurationSeconds === preset;
                    return (
                      <Pressable
                        key={preset}
                        onPress={() =>
                          setDraft((prev) => ({
                            ...prev,
                            votingDurationSeconds: preset,
                          }))
                        }
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        style={({ pressed }) => [
                          styles.presetChip,
                          isActive && styles.presetChipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            isActive && styles.presetChipTextActive,
                          ]}
                        >
                          {formatDurationLabel(preset)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Salvar configurações" onPress={handleSave} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(8, 7, 13, 0.72)",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    maxHeight: "88%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  sheetTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  sheetSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.78,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  summaryTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  summaryBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  summaryBadge: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  assassinBadge: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: "rgba(244, 63, 94, 0.35)",
  },
  detectiveBadge: {
    backgroundColor: COLORS.infoSoft,
    borderColor: "rgba(59, 130, 246, 0.35)",
  },
  angelBadge: {
    backgroundColor: COLORS.successSoft,
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  citizenBadge: {
    backgroundColor: COLORS.primarySoft,
    borderColor: "rgba(139, 61, 255, 0.35)",
  },
  summaryBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  warningNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: 2,
  },
  warningNoteText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  labelBlock: {
    flex: 1,
  },
  optionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  optionDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperDisabled: {
    opacity: 0.35,
  },
  stepperValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    minWidth: 26,
    textAlign: "center",
  },
  timerConfigBlock: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  timerStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  durationStepButton: {
    minWidth: 68,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  durationStepText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  durationValue: {
    color: COLORS.primaryText,
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  presetChip: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  presetChipActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  presetChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  presetChipTextActive: {
    color: COLORS.primaryText,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
});
