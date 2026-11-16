import { useAppSettings } from "@/hooks/useAppSettings";
import {
  cancelVibration,
  playCardHideHaptic,
  playCardRevealHaptic,
  playDayTransitionHaptic,
  playErrorHaptic,
  playLightImpactHaptic,
  playNightTransitionHaptic,
  playSelectionHaptic,
  playSuccessHaptic,
  playWarningHaptic,
} from "@/utils/haptics";
import { useCallback } from "react";

/**
 * Provides device haptic and vibration triggers gated by the user's app settings.
 */
export function useHaptics() {
  const { hapticsEnabled } = useAppSettings();

  const triggerDayTransition = useCallback(() => {
    if (hapticsEnabled) {
      playDayTransitionHaptic();
    }
  }, [hapticsEnabled]);

  const triggerNightTransition = useCallback(() => {
    if (hapticsEnabled) {
      playNightTransitionHaptic();
    }
  }, [hapticsEnabled]);

  const triggerCardReveal = useCallback(() => {
    if (hapticsEnabled) {
      playCardRevealHaptic();
    }
  }, [hapticsEnabled]);

  const triggerCardHide = useCallback(() => {
    if (hapticsEnabled) {
      playCardHideHaptic();
    }
  }, [hapticsEnabled]);

  const triggerSelection = useCallback(() => {
    if (hapticsEnabled) {
      playSelectionHaptic();
    }
  }, [hapticsEnabled]);

  const triggerLightImpact = useCallback(() => {
    if (hapticsEnabled) {
      playLightImpactHaptic();
    }
  }, [hapticsEnabled]);

  const triggerSuccess = useCallback(() => {
    if (hapticsEnabled) {
      playSuccessHaptic();
    }
  }, [hapticsEnabled]);

  const triggerWarning = useCallback(() => {
    if (hapticsEnabled) {
      playWarningHaptic();
    }
  }, [hapticsEnabled]);

  const triggerError = useCallback(() => {
    if (hapticsEnabled) {
      playErrorHaptic();
    }
  }, [hapticsEnabled]);

  return {
    hapticsEnabled,
    triggerDayTransition,
    triggerNightTransition,
    triggerCardReveal,
    triggerCardHide,
    triggerSelection,
    triggerLightImpact,
    triggerSuccess,
    triggerWarning,
    triggerError,
    cancelVibration,
  };
}
