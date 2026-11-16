import * as Haptics from "expo-haptics";
import { Platform, Vibration } from "react-native";

const DAY_TRANSITION_VIBRATION_MS = 140;
const NIGHT_TRANSITION_VIBRATION_MS = 500;

function runSafely(action: () => Promise<void> | void): void {
  try {
    const result = action();
    if (result && typeof (result as Promise<void>).catch === "function") {
      void (result as Promise<void>).catch(() => {
        // Ignore platform-specific haptic failures (e.g., unsupported web browsers or simulators).
      });
    }
  } catch {
    // Ignore synchronous vibration errors when hardware/API is unavailable.
  }
}

/**
 * Short vibration for dawn / day transition in Cidade Dorme.
 */
export function playDayTransitionHaptic(): void {
  if (Platform.OS === "ios") {
    runSafely(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    );
    return;
  }

  runSafely(() => {
    Vibration.vibrate(DAY_TRANSITION_VIBRATION_MS);
  });
}

/**
 * Medium/long vibration for dusk / night transition in Cidade Dorme.
 */
export function playNightTransitionHaptic(): void {
  if (Platform.OS === "ios") {
    // On iOS, Vibration.vibrate() triggers the standard ~400-500ms system vibration,
    // which is noticeably longer than Taptic Engine impact/notification taps.
    runSafely(() => {
      Vibration.vibrate();
    });
    return;
  }

  runSafely(() => {
    Vibration.vibrate(NIGHT_TRANSITION_VIBRATION_MS);
  });
}

export function playCardRevealHaptic(): void {
  runSafely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function playCardHideHaptic(): void {
  runSafely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function playSelectionHaptic(): void {
  runSafely(() => Haptics.selectionAsync());
}

export function playLightImpactHaptic(): void {
  runSafely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function playSuccessHaptic(): void {
  runSafely(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}

export function playWarningHaptic(): void {
  runSafely(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  );
}

export function playErrorHaptic(): void {
  runSafely(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );
}

export function cancelVibration(): void {
  runSafely(() => {
    Vibration.cancel();
  });
}
