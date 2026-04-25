import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";

export async function handleCombatTurn(combat, data) {
  if (!game.user.isGM) return;

  const combatant = combat.combatant;
  if (!combatant) return;

  const actor = combatant.actor;
  if (!isVitalityActor(actor)) return;

  const max = getVitalityMax(actor);
  const current = getVitalityValue(actor, max);
  const next = Math.min(current + 4, max);

  if (next === current) return;

  await setVitality(actor, next);
}