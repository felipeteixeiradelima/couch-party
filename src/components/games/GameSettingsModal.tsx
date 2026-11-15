import { Button } from "@/components/ui/Button";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { GameCategorySummary, GameSettings } from "@/types/game";
import {
  clampImpostorCount,
  clampVotingSeconds,
  formatDurationLabel,
  getMaxImpostors,
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

interface GameSettingsModalProps {
  visible: boolean;
  settings: GameSettings;
  categories: GameCategorySummary[];
  playerCount: number;
  onSave: (nextSettings: GameSettings) => void;
  onClose: () => void;
}

export function GameSettingsModal(props: GameSettingsModalProps) {
  const { visible, onClose } = props;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {visible ? <GameSettingsModalContent {...props} /> : null}
    </Modal>
  );
}

function GameSettingsModalContent({
  settings,
  categories,
  playerCount,
  onSave,
  onClose,
}: GameSettingsModalProps) {
  const [draft, setDraft] = useState<GameSettings>(() => ({
    ...settings,
    impostorCount: clampImpostorCount(settings.impostorCount, playerCount),
    votingDurationSeconds: clampVotingSeconds(settings.votingDurationSeconds),
  }));

  const maxImpostors = getMaxImpostors(playerCount);
  const isRandomCategory = draft.selectedCategoryIds.length === 0;

  const handleChangeImpostors = (delta: number) => {
    setDraft((prev) => ({
      ...prev,
      impostorCount: clampImpostorCount(
        prev.impostorCount + delta,
        playerCount,
      ),
    }));
  };

  const handleSelectRandomCategory = () => {
    setDraft((prev) => ({ ...prev, selectedCategoryIds: [] }));
  };

  const handleToggleCategory = (categoryId: string) => {
    setDraft((prev) => {
      const exists = prev.selectedCategoryIds.includes(categoryId);
      const nextIds = exists
        ? prev.selectedCategoryIds.filter((id) => id !== categoryId)
        : [...prev.selectedCategoryIds, categoryId];

      return { ...prev, selectedCategoryIds: nextIds };
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
    onSave({
      ...draft,
      impostorCount: clampImpostorCount(draft.impostorCount, playerCount),
      votingDurationSeconds: clampVotingSeconds(draft.votingDurationSeconds),
    });
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
            <Text style={styles.sheetTitle}>Configurações do jogo</Text>
            <Text style={styles.sheetSubtitle}>
              Personalize as regras desta partida
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
          {/* Quantidade de impostores */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.labelBlock}>
                <Text style={styles.optionTitle}>Quantidade de impostores</Text>
                <Text style={styles.optionDescription}>
                  Mínimo 1, máximo {maxImpostors} ({playerCount} jogadores)
                </Text>
              </View>

              <View style={styles.stepper}>
                <Pressable
                  onPress={() => handleChangeImpostors(-1)}
                  disabled={draft.impostorCount <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Diminuir quantidade de impostores"
                  style={({ pressed }) => [
                    styles.stepperButton,
                    draft.impostorCount <= 1 && styles.stepperDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={COLORS.textPrimary}
                  />
                </Pressable>

                <Text style={styles.stepperValue}>{draft.impostorCount}</Text>

                <Pressable
                  onPress={() => handleChangeImpostors(1)}
                  disabled={draft.impostorCount >= maxImpostors}
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar quantidade de impostores"
                  style={({ pressed }) => [
                    styles.stepperButton,
                    draft.impostorCount >= maxImpostors &&
                      styles.stepperDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Categoria */}
          <View style={styles.card}>
            <Text style={styles.optionTitle}>Categorias</Text>
            <Text style={styles.optionDescription}>
              Escolha uma ou mais categorias ou deixe aleatório. Se escolher
              várias, uma será sorteada por rodada.
            </Text>

            <View style={styles.chipsWrap}>
              <Pressable
                onPress={handleSelectRandomCategory}
                accessibilityRole="button"
                accessibilityState={{ selected: isRandomCategory }}
                style={({ pressed }) => [
                  styles.chip,
                  isRandomCategory && styles.chipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="shuffle-outline"
                  size={15}
                  color={isRandomCategory ? COLORS.white : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    isRandomCategory && styles.chipTextSelected,
                  ]}
                >
                  Aleatória (Todas)
                </Text>
              </Pressable>

              {categories.map((category) => {
                const isSelected = draft.selectedCategoryIds.includes(
                  category.id,
                );

                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleToggleCategory(category.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.chip,
                      isSelected && styles.chipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Dica de impostor */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.labelBlock}>
                <Text style={styles.optionTitle}>Dica para o impostor</Text>
                <Text style={styles.optionDescription}>
                  Se ativada, todos os impostores recebem a mesma dica na
                  rodada.
                </Text>
              </View>

              <Switch
                value={draft.hintEnabled}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, hintEnabled: value }))
                }
                trackColor={{
                  false: COLORS.border,
                  true: COLORS.primary,
                }}
                thumbColor={COLORS.white}
                accessibilityLabel="Habilitar dica para o impostor"
              />
            </View>
          </View>

          {/* Tempo de votação */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.labelBlock}>
                <Text style={styles.optionTitle}>Tempo de votação</Text>
                <Text style={styles.optionDescription}>
                  Cronômetro entre 30s e 10min durante a votação.
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
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    minHeight: 36,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: COLORS.white,
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
