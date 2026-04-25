import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";

const DEBUG_REST_HOOKS = true;

const HOOKS_TO_WATCH = [
  "preUpdateActor",
  "updateActor",
  "preUpdateItem",
  "updateItem",
  "createChatMessage",
  "renderDialog",
  "closeDialog"
];

export function registerRestHook() {
  console.log("vn-widget | Rest diagnostic hooks registered.");

  if (!DEBUG_REST_HOOKS) return;

  for (const hookName of HOOKS_TO_WATCH) {
    Hooks.on(hookName, (...args) => {
      logRestDiagnostic(hookName, args);
    });
  }
}

function logRestDiagnostic(hookName, args) {
  const summary = summarizeArgs(args);

  console.log(`VN REST DEBUG | ${hookName}`, summary);
}

function summarizeArgs(args) {
  return args.map((arg) => {
    if (!arg) return arg;

    if (arg instanceof Actor) {
      return {
        type: "Actor",
        name: arg.name,
        actorType: arg.type,
        id: arg.id
      };
    }

    if (arg instanceof Item) {
      return {
        type: "Item",
        name: arg.name,
        itemType: arg.type,
        id: arg.id,
        parent: arg.parent?.name
      };
    }

    if (arg instanceof ChatMessage) {
      return {
        type: "ChatMessage",
        speaker: arg.speaker,
        content: arg.content
      };
    }

    if (arg instanceof Dialog) {
      return {
        type: "Dialog",
        title: arg.title,
        id: arg.id
      };
    }

    if (typeof arg === "object") {
      return foundry.utils.deepClone(arg);
    }

    return arg;
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