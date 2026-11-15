import { Button } from "@/components/ui/Button";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  iconName?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  iconName = "help-circle-outline",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const isDanger = confirmVariant === "danger";
  const accentColor = isDanger ? COLORS.danger : COLORS.primaryText;
  const iconBgColor = isDanger ? COLORS.dangerSoft : COLORS.primarySoft;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable
          style={styles.backdrop}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Fechar modal"
        />

        <View style={styles.card}>
          <View
            style={[styles.iconBox, { backgroundColor: iconBgColor }]}
            accessible={false}
          >
            <Ionicons name={iconName} size={26} color={accentColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              style={styles.actionButton}
            />
            <Button
              label={confirmLabel}
              variant={confirmVariant}
              onPress={onConfirm}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(8, 7, 13, 0.78)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: SPACING.xxl,
  },
  actions: {
    width: "100%",
    gap: SPACING.sm,
  },
  actionButton: {
    width: "100%",
  },
});
