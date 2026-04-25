import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";

const REST_RECHARGE_DELAY_MS = 250;

/**
 * Detects an actual validated rest through the actor update caused by PF2e/SF2e.
 *
 * The old button listener was too early:
 * clicking "rest" opens a confirmation dialog, and cancellation still triggered VN recharge.
 *
 * This handler runs only when the system actually updates the actor.
 *
 * @param {Actor} actor
 * @param {object} changed
 * @param {object} options
 * @param {string} userId
 */
export async function handlePreUpdateActorForRest(actor, changed, options, userId) {
  if (!game.user.isGM) return;
  if (!isVitalityActor(actor)) return;

  if (!looksLikeRestUpdate(changed, options)) return;

  setTimeout(() => {
    rechargeVitalityOnRest(actor);
  }, REST_RECHARGE_DELAY_MS);
}

/**
 * Heuristic for SF2e/PF2e rest updates.
 *
 * The useful trace found during testing:
 * rest validation goes through SF2e's restForTheNight flow and produces
 * an actor update followed by a rest chat message.
 *
 * This avoids button-click listening entirely.
 *
 * @param {object} changed
 * @param {object} options
 * @returns {boolean}
 */
function looksLikeRestUpdate(changed, options) {
  const text = safeStringify({ changed, options }).toLowerCase();

  return (
    text.includes("rest") ||
    text.includes("restforthenight") ||
    text.includes("rest-for-the-night") ||
    text.includes("daily") ||
    text.includes("stamina") ||
    text.includes("resolve")
  );
}

function safeStringify(value) {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "";
  }
}

/**
 * Recharge vitality to maximum when actor actually rests.
 *
 * @param {Actor} actor
 */
export async function rechargeVitalityOnRest(actor) {
  const max = getVitalityMax(actor);
  const current = getVitalityValue(actor, max);

  if (current >= max) return;

  await rechargeVitality(actor);

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