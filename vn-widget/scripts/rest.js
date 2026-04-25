import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";

/**
 * Handle actor updates and detect an actual rest.
 *
 * The old implementation listened to the click on the rest button.
 * That was too early: the PF2e rest dialog may still be cancelled.
 *
 * This handler listens to actor updates instead, so the recharge only happens
 * after Foundry/PF2e has actually changed the actor.
 *
 * @param {Actor} actor - Updated actor
 * @param {object} changed - Changed actor data
 * @param {object} options - Update options
 * @param {string} userId - User ID that triggered the update
 */
export async function handleActorRestUpdate(actor, changed, options, userId) {
  if (!game.user.isGM) return;
  if (!isVitalityActor(actor)) return;

  if (!looksLikeRestUpdate(changed, options)) return;

  await rechargeVitalityOnRest(actor);
}

/**
 * Try to detect whether an actor update comes from a real rest.
 *
 * This is intentionally conservative: it looks for common rest-related traces
 * in the update payload or options.
 *
 * @param {object} changed - Changed actor data
 * @param {object} options - Update options
 * @returns {boolean}
 */
function looksLikeRestUpdate(changed, options) {
  const text = JSON.stringify({ changed, options }).toLowerCase();

  return (
    text.includes("rest") ||
    text.includes("daily") ||
    text.includes("overnight")
  );
}

/**
 * Recharge vitality to maximum when actor actually rests.
 *
 * @param {Actor} actor - The actor resting
 */
export async function rechargeVitalityOnRest(actor) {
  const max = getVitalityMax(actor);
  const current = getVitalityValue(actor, max);

  if (current >= max) return;

  await setVitality(actor, max);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="vn-chat">
        <div class="vn-chat-title">🌙 Repos</div>
        <p>
          <strong>${actor.name}</strong> recharge entièrement son Vitality Network.
        </p>
        <p>
          Réserve actuelle : <strong>${max}/${max}</strong>
        </p>
      </div>
    `
  });
}