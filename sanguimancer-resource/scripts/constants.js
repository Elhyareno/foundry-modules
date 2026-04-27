export const MODULE_ID = "sanguimancer-resource";

/**
 * Get actor level
 */
export function getLevel(actor) {
  return actor.level ?? actor.system?.details?.level?.value ?? 0;
}

/**
 * Get maximum resource value (level * 2)
 */
export function getMax(actor) {
  return getLevel(actor) * 2;
}

/**
 * Clamp a value between min and max
 */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Get temporary hit points
 */
export function getTHP(actor) {
  return actor.system?.attributes?.hp?.temp ?? 0;
}

/**
 * Get best DC (class or spell)
 */
export function getBestDC(actor) {
  return Math.max(
    actor.system?.attributes?.classDC?.value ?? 0,
    actor.system?.attributes?.spellDC?.value ?? 0
  );
}
