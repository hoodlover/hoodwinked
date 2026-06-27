// Mobile haptic helpers for solo games. Each call is a no-op on devices
// that don't support Vibration API (desktop, iOS Safari), so callers don't
// have to feature-check.
//
// Patterns are short on purpose — Play Store guidance is to use vibration
// sparingly so it reads as feedback rather than alarm.

function pulse(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  const vibrate = navigator.vibrate?.bind(navigator);
  if (typeof vibrate !== "function") return;
  try {
    vibrate(pattern);
  } catch {
    // Some browsers throw if vibration is disabled by user settings — ignore.
  }
}

export function hapticTap(): void {
  pulse(12);
}

export function hapticWin(): void {
  pulse([16, 60, 16, 60, 60]);
}

export function hapticLose(): void {
  pulse(260);
}

export function hapticDanger(): void {
  pulse([22, 80, 22]);
}

export function hapticReveal(): void {
  pulse(24);
}
