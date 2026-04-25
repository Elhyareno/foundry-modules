import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";

const PATCH_FLAG = "__vnWidgetRestPatched";

/**
 * Register a wrapper around PF2e/SF2e actor rest methods.
 *
 * This avoids listening to the rest button click.
 * The recharge happens only after the actual rest method completes,
 * so cancelling the confirmation dialog should not recharge Vitality Network.
 */
export function registerRestHook() {
  const actorProto = CONFIG.Actor?.documentClass?.prototype;
  if (!actorProto) {
    console.warn("vn-widget | Actor prototype not found. Rest hook not registered.");
    return;
  }

  if (actorProto[PATCH_FLAG]) return;
  actorProto[PATCH_FLAG] = true;

  const restMethodName = findRestMethodName(actorProto);

  if (!restMethodName) {
    console.warn("vn-widget | No compatible actor rest method found.", {
      availableMethods: Object.getOwnPropertyNames(actorProto).filter((name) =>
        name.toLowerCase().includes("rest")
      )
    });
    return;
  }

  const originalRest = actorProto[restMethodName];

  actorProto[restMethodName] = async function (...args) {
    const result = await originalRest.apply(this, args);

    if (isVitalityActor(this)) {
      await rechargeVitalityOnRest(this);
    }

    return result;
  };

  console.log(`vn-widget | Rest hook registered on Actor.${restMethodName}()`);
}

/**
 * Find the rest method exposed by the system actor class.
 *
 * PF2e has used rest-like methods with slightly different names across versions
 * and forks, so this tries common names first, then falls back to any method
 * containing "rest".
 *
 * @param {object} actorProto - Actor prototype
 * @returns {string|null}
 */
function findRestMethodName(actorProto) {
  const candidates = [
    "restForTheNight",
    "rest",
    "takeRest",
    "performRest"
  ];

  for (const name of candidates) {
    if (typeof actorProto[name] === "function") return name;
  }

  const methodNames = Object.getOwnPropertyNames(actorProto);

  return methodNames.find((name) =>
    typeof actorProto[name] === "function" &&
    name.toLowerCase().includes("rest")
  ) ?? null;
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