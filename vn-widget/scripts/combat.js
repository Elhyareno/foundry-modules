import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";

export async function handleCombatRound(combat, data) {
  if (!game.user.isGM) return;

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!isVitalityActor(actor)) continue;

    const max = getVitalityMax(actor);
    const current = getVitalityValue(actor, max);
    const next = Math.min(current + 4, max);

    if (next === current) continue;

    await setVitality(actor, next);
  }
}