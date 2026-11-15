import { useCallback, useEffect, useState } from "react";
import { AppState, GestureResponderEvent, Platform } from "react-native";

export function usePressHoldReveal() {
  const [isHolding, setIsHolding] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  const handlePressIn = useCallback(() => {
    setIsHolding(true);
    setHasViewed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setIsHolding(false);
  }, []);

  const handleTouchEnd = useCallback((event: GestureResponderEvent) => {
    if ((event.nativeEvent.touches?.length ?? 0) === 0) {
      setIsHolding(false);
    }
  }, []);

  const resetReveal = useCallback(() => {
    setIsHolding(false);
    setHasViewed(false);
  }, []);

  const hideOnly = useCallback(() => {
    setIsHolding(false);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        setIsHolding(false);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !isHolding || typeof window === "undefined") {
      return;
    }

    const handleGlobalRelease = () => setIsHolding(false);
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.hidden) {
        setIsHolding(false);
      }
    };

    window.addEventListener("pointerup", handleGlobalRelease);
    window.addEventListener("pointercancel", handleGlobalRelease);
    window.addEventListener("mouseup", handleGlobalRelease);
    window.addEventListener("touchend", handleGlobalRelease);
    window.addEventListener("touchcancel", handleGlobalRelease);
    window.addEventListener("blur", handleGlobalRelease);
    window.addEventListener("contextmenu", handleGlobalRelease);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.removeEventListener("pointerup", handleGlobalRelease);
      window.removeEventListener("pointercancel", handleGlobalRelease);
      window.removeEventListener("mouseup", handleGlobalRelease);
      window.removeEventListener("touchend", handleGlobalRelease);
      window.removeEventListener("touchcancel", handleGlobalRelease);
      window.removeEventListener("blur", handleGlobalRelease);
      window.removeEventListener("contextmenu", handleGlobalRelease);
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      }
    };
  }, [isHolding]);

  return {
    isHolding,
    hasViewed,
    handlePressIn,
    handlePressOut,
    handleTouchEnd,
    resetReveal,
    hideOnly,
  };
}
