import { getVitalityMax, setVitality } from "./resource.js";

/**
 * Bind rest button to recharge vitality
 * @param {HTMLElement} root - The root HTML element of the sheet
 * @param {Actor} actor - The actor
 */
export function bindRestButton(root, actor) {
  const selectors = [
    '[data-action="rest-for-the-night"]',
    '[data-action="rest"]',
    ".rest",
    "button.rest"
  ];

  const btn = root.querySelector(selectors.join(","));
  if (!btn) return;

  if (btn.dataset.vnBound === "true") return;
  btn.dataset.vnBound = "true";

  btn.addEventListener("click", () => {
    setTimeout(() => {
      rechargeVitalityOnRest(actor);
    }, 150);
  });
}

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