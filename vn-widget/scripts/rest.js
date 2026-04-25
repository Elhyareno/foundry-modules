import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";

const DEBUG_REST_HOOKS = true;
const REST_KEYWORDS = ["rest", "daily", "recover", "recovery", "night", "stamina"];

export function registerRestHook() {
  console.log("vn-widget | Rest diagnostic hook registered.");

  if (!DEBUG_REST_HOOKS) return;

  Hooks.onAll((hookName, ...args) => {
    const lowerHookName = String(hookName).toLowerCase();

    const hookLooksRelevant = REST_KEYWORDS.some((keyword) =>
      lowerHookName.includes(keyword)
    );

    const argsLookRelevant = REST_KEYWORDS.some((keyword) => {
      try {
        return JSON.stringify(args)?.toLowerCase().includes(keyword);
      } catch {
        return false;
      }
    });

    if (!hookLooksRelevant && !argsLookRelevant) return;

    console.log("VN REST HOOK DEBUG", {
      hookName,
      args
    });
  });
}

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