import { MODULE_ID } from "../constants.js";
import { hasBloodShield, assertSanguimancerFeat } from "../feats.js";
import { postToChat } from "../chat.js";

/**
 * Version stable actuelle :
 * effet CA + hardness stockée en flag.
 *
 * Prochaine évolution :
 * créer un vrai bouclier PF2e temporaire.
 */
export async function useBloodShield(actor, spent) {
  if (!assertSanguimancerFeat(actor, hasBloodShield, "Don Blood Shield manquant.")) return null;

  const amount = Number(spent);

  if (!Number.isFinite(amount) || amount < 1) {
    ui.notifications.warn("Blood Shield demande au moins 1 PV sanguimancien.");
    return null;
  }

  const state = await game.sanguimancer.getState(actor);

  if (state.current < amount) {
    ui.notifications.warn("Pas assez de PV sanguimanciens pour Blood Shield.");
    return null;
  }

  await game.sanguimancer.spendResource(actor, amount, "Blood Shield");

  await removeBloodShieldEffect(actor);

  const [effect] = await createBloodShieldEffect(actor, amount);

  postToChat(
    actor,
    `
      Blood Shield activé.<br>
      Bonus CA : +${getBloodShieldACBonus(amount)}<br>
      Hardness : ${amount * 4}<br>
      Durée : jusqu'au début de ton prochain tour ou jusqu'au Shield Block.
    `
  );

  return effect;
}

export function getBloodShieldACBonus(spent) {
  return spent >= 10 ? 2 : 1;
}

export async function createBloodShieldEffect(actor, spent) {
  const bonus = getBloodShieldACBonus(spent);
  const hardness = spent * 4;

  return actor.createEmbeddedDocuments("Item", [{
    name: "Blood Shield",
    type: "effect",
    system: {
      duration: {
        value: 1,
        unit: "rounds",
        expiry: "turn-start",
      },
      rules: [{
        key: "FlatModifier",
        selector: "ac",
        type: "circumstance",
        value: bonus,
      }],
    },
    flags: {
      [MODULE_ID]: {
        type: "blood-shield",
        bloodShield: true,
        spent,
        acBonus: bonus,
        hardness,
      },
    },
  }]);
}

export async function removeBloodShieldEffect(actor) {
  const effects = actor.itemTypes?.effect?.filter(
    (effect) => effect.getFlag(MODULE_ID, "bloodShield")
      || effect.getFlag(MODULE_ID, "type") === "blood-shield"
  ) ?? [];

  if (!effects.length) return;

  await actor.deleteEmbeddedDocuments("Item", effects.map((effect) => effect.id));
}