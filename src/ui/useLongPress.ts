import { useRef } from "react";

/**
 * Tap calls onTap; holding for 450 ms (or right-click on desktop) calls onLong instead. Phones have
 * no hover, so long-press is how players inspect anything (D-010).
 */
export function useLongPress(onTap: () => void, onLong: () => void) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const start = () => {
    fired.current = false;
    timer.current = window.setTimeout(() => {
      fired.current = true;
      onLong();
    }, 450);
  };
  const stop = () => window.clearTimeout(timer.current);
  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onClick: () => {
      if (!fired.current) onTap();
    },
    onContextMenu: (e: { preventDefault(): void }) => {
      e.preventDefault();
      stop();
      fired.current = true;
      onLong();
    },
  };
}
