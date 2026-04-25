import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor, getSpellcastingDCRank } from "./actor.js";

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
  const regen = getVitalityRegen(actor);
  const next = Math.min(current + regen, max);
  const gained = next - current;

  if (gained <= 0) return;

  await setVitality(actor, next);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="vn-chat">
        <div class="vn-chat-title">⚡ Vitality Network</div>
        <p>
          <strong>${actor.name}</strong> récupère 
          <strong>${gained}</strong> point${gained > 1 ? "s" : ""} de Vitality Network.
        </p>
        <p>
          Maîtrise du DD de sort : <strong>${getProficiencyLabel(getSpellcastingDCRank(actor))}</strong>
        </p>
        <p>
          Réserve actuelle : <strong>${next}/${max}</strong>
        </p>
      </div>
    `
  });
}

/**
 * Get Vitality Network regeneration amount from spellcasting DC proficiency.
 *
 * @param {Actor} actor - The actor
 * @returns {number}
 */
function getVitalityRegen(actor) {
  const rank = getSpellcastingDCRank(actor);

  if (rank >= 4) return 8;
  if (rank >= 3) return 6;

  return 4;
}

/**
 * Get a readable proficiency label.
 *
 * @param {number} rank - Proficiency rank
 * @returns {string}
 */
function getProficiencyLabel(rank) {
  if (rank >= 4) return "légendaire";
  if (rank >= 3) return "maître";
  if (rank >= 2) return "expert";
  if (rank >= 1) return "qualifié";

  return "non qualifié";
}