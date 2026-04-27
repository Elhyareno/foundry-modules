import { MODULE_ID } from "../constants.js";

/**
 * Create Blood Shield effect
 */
export async function createBloodShieldEffect(actor, spent) {
  const bonus = spent >= 10 ? 2 : 1;
  const hardness = spent * 4;

  return actor.createEmbeddedDocuments("Item", [{
    name: "Blood Shield",
    type: "effect",
    system: {
      duration: { value: 1, unit: "rounds", expiry: "turn-start" },
      rules: [{
        key: "FlatModifier",
        selector: "ac",
        type: "circumstance",
        value: bonus
      }]
    },
    flags: {
      [MODULE_ID]: { bloodShield: true, hardness }
    }
  }]);
}

/**
 * Remove Blood Shield effect
 */
export async function removeBloodShieldEffect(actor) {
  const effects = actor.itemTypes.effect.filter(e => e.getFlag(MODULE_ID, "bloodShield"));
  if (effects.length) {
    await actor.deleteEmbeddedDocuments("Item", effects.map(e => e.id));
  }
}
