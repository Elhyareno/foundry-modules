import { FLAG_SCOPE, FLAG_KEY } from "./constants.js";
import { getActorLevel } from "./actor.js";

/**
 * Calculate the maximum Vitality for an actor
 * @param {Actor} actor - The actor
 * @returns {number} Maximum vitality value
 */
export function getVitalityMax(actor) {
  return 6 + (getActorLevel(actor) * 4);
}

/**
 * Get the current Vitality value of an actor
 * @param {Actor} actor - The actor
 * @param {number} max - Maximum vitality (optional)
 * @returns {number} Current vitality value
 */
export function getVitalityValue(actor, max = getVitalityMax(actor)) {
  const flag = actor.getFlag(FLAG_SCOPE, FLAG_KEY) ?? {};
  return Math.max(0, Math.min(Number(flag.value ?? 0), max));
}

/**
 * Set the Vitality value of an actor
 * @param {Actor} actor - The actor
 * @param {number} value - The value to set
 */
export async function setVitality(actor, value) {
  await actor.setFlag(FLAG_SCOPE, FLAG_KEY, { value });
}
