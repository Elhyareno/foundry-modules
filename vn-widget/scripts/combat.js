import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";


export async function handleCombatUpdate(combat, changed, options, userId) {
  if (!game.user.isGM) return;

  const hasTurnChanged = Object.hasOwn(changed, "turn");
  const hasRoundChanged = Object.hasOwn(changed, "round");

  if (!hasTurnChanged && !hasRoundChanged) return;

  const combatant = combat.combatant;
  if (!combatant) return;

  const actor = combatant.actor;
  if (!isVitalityActor(actor)) return;

  await regenerateVitality(actor);
}

/**
 * Regenerate Vitality Network for an actor.
 * @param {Actor} actor - The actor to regenerate
 */
async function regenerateVitality(actor) {
  const max = getVitalityMax(actor);
  const current = getVitalityValue(actor, max);
  const next = Math.min(current + 4, max);

  if (next === current) return;

  await setVitality(actor, next);
  await chatMessage.create({
    speaker: chatMessage.getSpeaker({ actor }),
    content:  `
      <div class="vn-chat">
        <div class="vn-chat-title">⚡ Vitality Network</div>
        <p>
          <strong>${actor.name}</strong> récupère 
          <strong>${gained}</strong> point${gained > 1 ? "s" : ""} de Vitality Network.
        </p>
        <p>
          Réserve actuelle : <strong>${next}/${max}</strong>
        </p>
      </div>
    `
  });
}