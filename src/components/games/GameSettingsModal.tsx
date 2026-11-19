import { Button } from "@/components/ui/Button";
import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { GameCategorySummary, GameSettings } from "@/types/game";
import {
  clampDiscussionSeconds,
  clampImpostorCount,
  clampVotingSeconds,
  DISCUSSION_PRESET_SECONDS,
  DISCUSSION_STEP_SECONDS,
  formatDurationLabel,
  getMaxImpostors,
  MAX_DISCUSSION_SECONDS,
  MAX_VOTING_SECONDS,
  MIN_DISCUSSION_SECONDS,
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
  showHintSetting?: boolean;
  showDiscussionTimerSetting?: boolean;
  onSave: (nextSettings: GameSettings) => void;
  onClose: () => void;
}

export function GameSettingsModal(props: GameSettingsModalProps) {
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
      {visible ? <GameSettingsModalContent {...props} /> : null}
    </Modal>
  );
}

function GameSettingsModalContent({
  settings,
  categories,
  playerCount,
  showHintSetting = true,
  showDiscussionTimerSetting = false,
  onSave,
  onClose,
}: GameSettingsModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [draft, setDraft] = useState<GameSettings>(() => ({
    ...settings,
    impostorCount: clampImpostorCount(settings.impostorCount, playerCount),
    discussionDurationSeconds: clampDiscussionSeconds(
      settings.discussionDurationSeconds,
    ),
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

  const handleChangeDiscussionDuration = (delta: number) => {
    setDraft((prev) => ({
      ...prev,
      discussionDurationSeconds: clampDiscussionSeconds(
        prev.discussionDurationSeconds + delta,
      ),
    }));
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
      discussionDurationSeconds: clampDiscussionSeconds(
        draft.discussionDurationSeconds,
      ),
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
            <Ionicons name="close" size={20} color={colors.textPrimary} />
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
                    color={colors.textPrimary}
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
                  <Ionicons name="add" size={18} color={colors.textPrimary} />
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
                  color={isRandomCategory ? colors.white : colors.textSecondary}
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
          {showHintSetting ? (
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
                    false: colors.switchTrackOff,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
                  accessibilityLabel="Habilitar dica para o impostor"
                />
              </View>
            </View>
          ) : null}

          {/* Tempo de discussão (Impostor) */}
          {showDiscussionTimerSetting ? (
            <TimerSettingCard
              title="Tempo de discussão"
              description="Cronômetro entre 30s e 10min durante o debate antes da votação."
              switchAccessibilityLabel="Habilitar tempo de discussão"
              decreaseAccessibilityLabel="Diminuir tempo de discussão em 30 segundos"
              increaseAccessibilityLabel="Aumentar tempo de discussão em 30 segundos"
              enabled={draft.discussionTimerEnabled}
              durationSeconds={draft.discussionDurationSeconds}
              minSeconds={MIN_DISCUSSION_SECONDS}
              maxSeconds={MAX_DISCUSSION_SECONDS}
              stepSeconds={DISCUSSION_STEP_SECONDS}
              presets={DISCUSSION_PRESET_SECONDS}
              onToggle={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  discussionTimerEnabled: value,
                }))
              }
              onStep={handleChangeDiscussionDuration}
              onSelectPreset={(preset) =>
                setDraft((prev) => ({
                  ...prev,
                  discussionDurationSeconds: preset,
                }))
              }
            />
          ) : null}

          {/* Tempo de votação */}
          <TimerSettingCard
            title="Tempo de votação"
            description="Cronômetro entre 30s e 10min durante a votação."
            switchAccessibilityLabel="Habilitar tempo de votação"
            decreaseAccessibilityLabel="Diminuir tempo de votação em 30 segundos"
            increaseAccessibilityLabel="Aumentar tempo de votação em 30 segundos"
            enabled={draft.votingTimerEnabled}
            durationSeconds={draft.votingDurationSeconds}
            minSeconds={MIN_VOTING_SECONDS}
            maxSeconds={MAX_VOTING_SECONDS}
            stepSeconds={VOTING_STEP_SECONDS}
            presets={VOTING_PRESET_SECONDS}
            onToggle={(value) =>
              setDraft((prev) => ({
                ...prev,
                votingTimerEnabled: value,
              }))
            }
            onStep={handleChangeVotingDuration}
            onSelectPreset={(preset) =>
              setDraft((prev) => ({
                ...prev,
                votingDurationSeconds: preset,
              }))
            }
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Salvar configurações" onPress={handleSave} />
        </View>
      </View>
    </View>
  );
}

interface TimerSettingCardProps {
  title: string;
  description: string;
  switchAccessibilityLabel: string;
  decreaseAccessibilityLabel: string;
  increaseAccessibilityLabel: string;
  enabled: boolean;
  durationSeconds: number;
  minSeconds: number;
  maxSeconds: number;
  stepSeconds: number;
  presets: readonly number[];
  onToggle: (value: boolean) => void;
  onStep: (delta: number) => void;
  onSelectPreset: (seconds: number) => void;
}

function TimerSettingCard({
  title,
  description,
  switchAccessibilityLabel,
  decreaseAccessibilityLabel,
  increaseAccessibilityLabel,
  enabled,
  durationSeconds,
  minSeconds,
  maxSeconds,
  stepSeconds,
  presets,
  onToggle,
  onStep,
  onSelectPreset,
}: TimerSettingCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.labelBlock}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionDescription}>{description}</Text>
        </View>

        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{
            false: colors.switchTrackOff,
            true: colors.primary,
          }}
          thumbColor={colors.white}
          accessibilityLabel={switchAccessibilityLabel}
        />
      </View>

      {enabled ? (
        <View style={styles.timerConfigBlock}>
          <View style={styles.timerStepperRow}>
            <Pressable
              onPress={() => onStep(-stepSeconds)}
              disabled={durationSeconds <= minSeconds}
              accessibilityRole="button"
              accessibilityLabel={decreaseAccessibilityLabel}
              style={({ pressed }) => [
                styles.durationStepButton,
                durationSeconds <= minSeconds && styles.stepperDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.durationStepText}>-{stepSeconds}s</Text>
            </Pressable>

            <Text style={styles.durationValue}>
              {formatDurationLabel(durationSeconds)}
            </Text>

            <Pressable
              onPress={() => onStep(stepSeconds)}
              disabled={durationSeconds >= maxSeconds}
              accessibilityRole="button"
              accessibilityLabel={increaseAccessibilityLabel}
              style={({ pressed }) => [
                styles.durationStepButton,
                durationSeconds >= maxSeconds && styles.stepperDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.durationStepText}>+{stepSeconds}s</Text>
            </Pressable>
          </View>

          <View style={styles.presetsRow}>
            {presets.map((preset) => {
              const isActive = durationSeconds === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => onSelectPreset(preset)}
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
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
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
      backgroundColor: colors.sheetBackdrop,
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      borderTopWidth: 1,
      borderColor: colors.border,
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
      borderBottomColor: colors.borderSubtle,
    },
    sheetTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "800",
    },
    sheetSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    optionDescription: {
      color: colors.textSecondary,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperDisabled: {
      opacity: 0.35,
    },
    stepperValue: {
      color: colors.textPrimary,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 8,
      minHeight: 36,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    chipTextSelected: {
      color: colors.white,
    },
    timerConfigBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.md,
    },
    durationStepText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    durationValue: {
      color: colors.primaryText,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    presetChipActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    presetChipText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    presetChipTextActive: {
      color: colors.primaryText,
    },
    footer: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xxl,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
  });
