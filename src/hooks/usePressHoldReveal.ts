import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, GestureResponderEvent, Platform } from "react-native";

interface UsePressHoldRevealOptions {
  onReveal?: () => void;
  onHide?: () => void;
}

export function usePressHoldReveal(options?: UsePressHoldRevealOptions) {
  const [isHolding, setIsHolding] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const isHoldingRef = useRef(false);
  const onRevealRef = useRef(options?.onReveal);
  const onHideRef = useRef(options?.onHide);

  useEffect(() => {
    onRevealRef.current = options?.onReveal;
    onHideRef.current = options?.onHide;
  }, [options?.onReveal, options?.onHide]);

  const setHoldingState = useCallback((next: boolean, notify = true) => {
    if (isHoldingRef.current === next) {
      return;
    }

    isHoldingRef.current = next;
    setIsHolding(next);

    if (notify) {
      if (next) {
        onRevealRef.current?.();
      } else {
        onHideRef.current?.();
      }
    }
  }, []);

  const handlePressIn = useCallback(() => {
    setHasViewed(true);
    setHoldingState(true);
  }, [setHoldingState]);

  const handlePressOut = useCallback(() => {
    setHoldingState(false);
  }, [setHoldingState]);

  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      if ((event.nativeEvent.touches?.length ?? 0) === 0) {
        setHoldingState(false);
      }
    },
    [setHoldingState],
  );

  const resetReveal = useCallback(() => {
    setHoldingState(false, false);
    setHasViewed(false);
  }, [setHoldingState]);

  const hideOnly = useCallback(() => {
    setHoldingState(false, false);
  }, [setHoldingState]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        setHoldingState(false);
      }
    });

    return () => subscription.remove();
  }, [setHoldingState]);

  useEffect(() => {
    if (Platform.OS !== "web" || !isHolding || typeof window === "undefined") {
      return;
    }

    const handleGlobalRelease = () => setHoldingState(false);
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.hidden) {
        setHoldingState(false);
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
  }, [isHolding, setHoldingState]);

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
