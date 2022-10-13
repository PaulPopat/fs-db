export function Keys<T extends Record<string, unknown>>(
  target: T
): (keyof T)[] {
  return Object.keys(target);
}
