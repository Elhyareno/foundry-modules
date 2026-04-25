import { FLAG_SCOPE, FLAG_KEY } from "./constants.js";
import { getActorLevel } from "./actor.js";

/**
 * Calculate the maximum Vitality for an actor.
 *
 * @param {Actor} actor - The actor
 * @returns {number} Maximum vitality value
 */
export function getVitalityMax(actor) {
  const level = Math.max(1, Number(getActorLevel(actor) ?? 1));
  return 6 + (level * 4);
}

/**
 * Clamp a vitality value between 0 and the actor's maximum.
 *
 * @param {Actor} actor - The actor
 * @param {number} value - Raw vitality value
 * @returns {number} Clean vitality value
 */
export function clampVitality(actor, value) {
  const max = getVitalityMax(actor);
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return 0;

  return Math.max(0, Math.min(numericValue, max));
}

/**
 * Get the current Vitality value of an actor.
 *
 * @param {Actor} actor - The actor
 * @param {number} max - Maximum vitality, optional
 * @returns {number} Current vitality value
 */
export function getVitalityValue(actor, max = getVitalityMax(actor)) {
  const flag = actor.getFlag(FLAG_SCOPE, FLAG_KEY) ?? {};
  const rawValue = Number(flag.value ?? 0);

  if (!Number.isFinite(rawValue)) return 0;

  return Math.max(0, Math.min(rawValue, max));
}

/**
 * Set the Vitality value of an actor.
 *
 * The value is always clamped before being stored.
 *
 * @param {Actor} actor - The actor
 * @param {number} value - The value to set
 */
export async function setVitality(actor, value) {
  const cleanValue = clampVitality(actor, value);

  await actor.setFlag(FLAG_SCOPE, FLAG_KEY, {
    value: cleanValue
  });
}

/**
 * Recharge Vitality to maximum.
 *
 * @param {Actor} actor - The actor to recharge
 */
export async function rechargeVitality(actor) {
  await setVitality(actor, getVitalityMax(actor));
}