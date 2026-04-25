import { getVitalityMax, setVitality } from "./resource.js";

/**
 * Recharge vitality to maximum when actor rests
 * @param {Actor} actor - The actor resting
 */
export async function rechargeVitalityOnRest(actor) {
  const max = getVitalityMax(actor);
  await setVitality(actor, max);

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="vn-chat">
        <div class="vn-chat-title">🌙 Repos</div>
        <p>${actor.name} recharge entièrement son réseau.</p>
      </div>
    `
  });
}
