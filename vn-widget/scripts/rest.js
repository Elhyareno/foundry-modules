import { FCoreChat } from "../../lib-foundry-core/scripts/index.js";
import { getVitalityMax, getVitalityValue, rechargeVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";

const REST_RECHARGE_DELAY_MS = 250;

export async function handlePreUpdateActorForRest(actor, changed, options, userId) {
  if (!game.user.isGM) return;
  if (!isVitalityActor(actor)) return;

  if (!looksLikeRestUpdate(changed, options)) return;

  setTimeout(() => {
    rechargeVitalityOnRest(actor);
  }, REST_RECHARGE_DELAY_MS);
}

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

export async function rechargeVitalityOnRest(actor) {
  const max = getVitalityMax(actor);
  const current = getVitalityValue(actor, max);

  if (current >= max) return;

  await rechargeVitality(actor);

  await FCoreChat.send(`
    <div class="vn-chat">
      <div class="vn-chat-title">🌙 Repos</div>
      <p>
        <strong>${actor.name}</strong> recharge entièrement son Vitality Network.
      </p>
      <p>
        Réserve actuelle : <strong>${max}/${max}</strong>
      </p>
    </div>
  `, { actor });
}