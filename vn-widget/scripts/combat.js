import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";

/**
 * Handle combat round regeneration
 * @param {Combat} combat - The combat object
 * @param {object} data - Combat data
 */
export async function handleCombatRound(combat, data) {
  if (!game.user.isGM) return;

  for (const c of combat.combatants) {
    const actor = c.actor;
    if (!actor) continue;

    const max = getVitalityMax(actor);
    const current = getVitalityValue(actor, max);
    const next = Math.min(current + 4, max);

    if (next === current) continue;
    await setVitality(actor, next);
  }
}
