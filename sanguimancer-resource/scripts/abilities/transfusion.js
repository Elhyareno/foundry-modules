import { MODULE_ID } from "../constants.js";
import { postToChat } from "../chat.js";

/**
 * Create Transfusion effect
 */
export async function createTransfusionEffect(target, value) {
  return target.createEmbeddedDocuments("Item", [{
    name: `Transfusion (${value})`,
    type: "effect",
    system: {
      duration: { value: 5, unit: "rounds", expiry: "turn-end" }
    },
    flags: {
      [MODULE_ID]: { transfusion: true, fastHealing: value }
    }
  }]);
}

/**
 * Get all transfusion effects on an actor
 */
export function getTransfusionEffects(actor) {
  return actor.itemTypes.effect.filter(e => e.getFlag(MODULE_ID, "transfusion"));
}

/**
 * Apply transfusion healing (fast healing)
 */
export async function applyTransfusionHealing(actor) {
  const total = getTransfusionEffects(actor)
    .reduce((s, e) => s + (e.getFlag(MODULE_ID, "fastHealing") || 0), 0);

  if (!total) return;

  const hp = actor.system.attributes.hp;
  const heal = Math.min(total, hp.max - hp.value);

  if (heal > 0) {
    await actor.update({ "system.attributes.hp.value": hp.value + heal });
    postToChat(actor, `Transfusion +${heal} PV`);
  }
}
