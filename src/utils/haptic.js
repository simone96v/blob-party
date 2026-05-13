const ok = typeof navigator !== 'undefined' && 'vibrate' in navigator

export const haptic = {
  light:  () => ok && navigator.vibrate(8),
  medium: () => ok && navigator.vibrate(15),
  heavy:  () => ok && navigator.vibrate(30),
  tick:   () => ok && navigator.vibrate(4),
  double: () => ok && navigator.vibrate([12, 40, 12]),
  land:   () => ok && navigator.vibrate([20, 30, 40]),
}
