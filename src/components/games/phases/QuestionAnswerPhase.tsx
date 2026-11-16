import { AnimatedPhaseView } from "@/components/ui/AnimatedPhaseView";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";
import { ActiveRoundState } from "@/types/game";
import { Ionicons } from "@expo/vector-icons";
import React, { ComponentRef, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const MAX_ANSWER_LENGTH = 140;

interface QuestionAnswerPhaseProps {
  round: ActiveRoundState;
  onCompleteAnswers: (answers: Record<string, string>) => void;
  onRequestExit: () => void;
}

export function QuestionAnswerPhase({
  round,
  onCompleteAnswers,
  onRequestExit,
}: QuestionAnswerPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isInputFocused, setIsInputFocused] = useState(false);

  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { triggerLightImpact } = useHaptics();

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      subscription.remove();
    };
  }, [isUnlocked]);

  if (round.prompt.gameId !== "perguntas") {
    return null;
  }

  const totalPlayers = round.assignments.length;
  const currentAssignment = round.assignments[currentIndex];
  const isLastPlayer = currentIndex >= totalPlayers - 1;

  if (!currentAssignment) {
    return null;
  }

  const { prompt } = round;
  // Both roles share the exact same UI so the impostor does not know their role.
  const questionText =
    currentAssignment.role === "impostor"
      ? prompt.impostorQuestion
      : prompt.innocentQuestion;

  const trimmedAnswer = answerText.trim();
  const canConfirm = trimmedAnswer.length > 0;

  const handleUnlock = () => {
    triggerLightImpact();
    setIsUnlocked(true);
  };

  const handleConfirmAnswer = () => {
    if (!canConfirm) {
      return;
    }

    Keyboard.dismiss();
    triggerLightImpact();

    const nextAnswers = {
      ...answers,
      [currentAssignment.player.id]: trimmedAnswer,
    };

    setAnswers(nextAnswers);
    setAnswerText("");
    setIsInputFocused(false);
    setIsUnlocked(false);

    if (isLastPlayer) {
      onCompleteAnswers(nextAnswers);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  if (!isUnlocked) {
    return (
      <AnimatedPhaseView
        key={`question-handoff-${currentAssignment.player.id}`}
        style={styles.container}
        variant="slide-right"
        duration={220}
      >
        <QuestionProgressHeader
          currentIndex={currentIndex}
          assignments={round.assignments}
          onRequestExit={onRequestExit}
        />

        <View style={styles.handoffCenter}>
          <View style={styles.handoffCard}>
            <PlayerAvatar
              name={currentAssignment.player.name}
              color={currentAssignment.player.color}
              size={68}
            />

            <Text style={styles.handoffOverline}>VEZ DE RESPONDER</Text>
            <Text style={styles.handoffPlayerName} numberOfLines={1}>
              {currentAssignment.player.name}
            </Text>
            <Text style={styles.handoffHint}>
              Entregue o celular para{" "}
              <Text style={styles.handoffHintBold}>
                {currentAssignment.player.name}
              </Text>
              . Garanta que mais ninguém está olhando a tela.
            </Text>

            <View style={styles.privacyPill}>
              <Ionicons
                name="lock-closed-outline"
                size={14}
                color={COLORS.warning}
              />
              <Text style={styles.privacyPillText}>
                Sua pergunta e resposta são secretas.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label={`Sou ${currentAssignment.player.name}`}
            onPress={handleUnlock}
            icon={
              <Ionicons
                name="lock-open-outline"
                size={20}
                color={COLORS.white}
              />
            }
          />
        </View>
      </AnimatedPhaseView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AnimatedPhaseView
        key={`question-answer-${currentAssignment.player.id}`}
        style={styles.container}
        variant="fade-up"
        duration={220}
      >
        <QuestionProgressHeader
          currentIndex={currentIndex}
          assignments={round.assignments}
          onRequestExit={onRequestExit}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.metaRow}>
            <View style={styles.playerBadge}>
              <PlayerAvatar
                name={currentAssignment.player.name}
                color={currentAssignment.player.color}
                size={24}
              />
              <Text style={styles.playerBadgeText} numberOfLines={1}>
                {currentAssignment.player.name}
              </Text>
            </View>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText} numberOfLines={1}>
                {prompt.categoryName}
              </Text>
            </View>
          </View>

          <View style={styles.questionCard}>
            <View style={styles.questionIconCircle} accessible={false}>
              <Ionicons
                name="help-circle-outline"
                size={32}
                color={COLORS.warning}
              />
            </View>
            <Text style={styles.questionOverline}>SUA PERGUNTA</Text>
            <Text style={styles.questionText}>{questionText}</Text>
          </View>

          <View style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerLabel}>Sua resposta</Text>
              <Text style={styles.charCounter}>
                {trimmedAnswer.length}/{MAX_ANSWER_LENGTH}
              </Text>
            </View>

            <TextInput
              value={answerText}
              onChangeText={(text) =>
                setAnswerText(text.replace(/[\r\n]+/g, ""))
              }
              onFocus={() => {
                setIsInputFocused(true);
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 120);
              }}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Digite sua resposta aqui..."
              placeholderTextColor={COLORS.textMuted}
              maxLength={MAX_ANSWER_LENGTH}
              multiline
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={() => Keyboard.dismiss()}
              textAlignVertical="top"
              style={[
                styles.answerInput,
                isInputFocused && styles.answerInputFocused,
              ]}
              accessibilityLabel={`Resposta de ${currentAssignment.player.name}`}
            />

            <Text style={styles.answerHelper}>
              Todas as respostas serão reveladas juntas quando todos terminarem.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={
              isLastPlayer
                ? "Confirmar e revelar respostas"
                : "Confirmar e passar"
            }
            onPress={handleConfirmAnswer}
            disabled={!canConfirm}
            icon={
              <Ionicons
                name={
                  isLastPlayer
                    ? "checkmark-done-outline"
                    : "arrow-forward-outline"
                }
                size={20}
                color={COLORS.white}
              />
            }
          />
        </View>
      </AnimatedPhaseView>
    </KeyboardAvoidingView>
  );
}

interface QuestionProgressHeaderProps {
  currentIndex: number;
  assignments: ActiveRoundState["assignments"];
  onRequestExit: () => void;
}

function QuestionProgressHeader({
  currentIndex,
  assignments,
  onRequestExit,
}: QuestionProgressHeaderProps) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topSpacer} />

      <View style={styles.progressBlock}>
        <Text style={styles.progressLabel}>
          Jogador {currentIndex + 1} de {assignments.length}
        </Text>
        <View style={styles.progressTrack} accessible={false}>
          {assignments.map((assignment, index) => (
            <View
              key={assignment.player.id}
              style={[
                styles.progressSegment,
                index <= currentIndex && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={onRequestExit}
        accessibilityRole="button"
        accessibilityLabel="Sair da partida"
        style={({ pressed }) => [styles.exitButton, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Ionicons name="close" size={20} color={COLORS.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  topSpacer: {
    width: 38,
  },
  progressBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: SPACING.xs,
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    maxWidth: 220,
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    minWidth: 4,
    maxWidth: 22,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  progressSegmentActive: {
    backgroundColor: COLORS.primary,
  },
  exitButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.75,
  },
  handoffCenter: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: SPACING.md,
  },
  handoffCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
  },
  handoffOverline: {
    color: COLORS.primaryText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: SPACING.lg,
    marginBottom: 4,
  },
  handoffPlayerName: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  handoffHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: SPACING.lg,
  },
  handoffHintBold: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  privacyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.warningSoft,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  privacyPillText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  playerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: SPACING.md,
    flexShrink: 1,
  },
  playerBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    flexShrink: 1,
  },
  categoryBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.38)",
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
  },
  questionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.warningSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  questionOverline: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: SPACING.xs,
  },
  questionText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  answerCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  answerLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  charCounter: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  answerInput: {
    minHeight: 96,
    maxHeight: 150,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  answerInputFocused: {
    borderColor: COLORS.primary,
  },
  answerHelper: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
});
