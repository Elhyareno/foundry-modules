import { MODULE_ID } from "../constants.js";
import { hasBloodShield, assertSanguimancerFeat } from "../feats.js";
import { postToChat } from "../chat.js";

const BLOOD_SHIELD_TYPE = "blood-shield";
const BLOOD_SHIELD_EFFECT_TYPE = "blood-shield-effect";

export function getBloodShieldACBonus(spent) {
  return Number(spent) >= 10 ? 2 : 1;
}

export function getBloodShieldHardness(spent) {
  return Number(spent) * 4;
}

export function getBloodShieldHP(spent) {
  // La règle donne seulement la Hardness.
  // Pour que PF2e accepte un bouclier destructible, on lui donne des HP égaux à la Hardness.
  // Si tu préfères, on pourra mettre spent * 8 ou un autre modèle.
  return Math.max(1, getBloodShieldHardness(spent));
}

function getBloodShieldItems(actor) {
  return actor.itemTypes?.shield?.filter(
    (item) => item.getFlag(MODULE_ID, "type") === BLOOD_SHIELD_TYPE
  ) ?? [];
}

function getBloodShieldEffects(actor) {
  return actor.itemTypes?.effect?.filter(
    (effect) =>
      effect.getFlag(MODULE_ID, "type") === BLOOD_SHIELD_EFFECT_TYPE ||
      effect.getFlag(MODULE_ID, "bloodShield")
  ) ?? [];
}

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

  await removeBloodShield(actor);

  await game.sanguimancer.spendResource(actor, amount, "Blood Shield");

  const [shield] = await createBloodShieldItem(actor, amount);
  const [effect] = await createBloodShieldEffect(actor, amount, shield);

  postToChat(
    actor,
    `
      Blood Shield activé.<br>
      Bonus CA : +${getBloodShieldACBonus(amount)}<br>
      Hardness : ${getBloodShieldHardness(amount)}<br>
      Bouclier temporaire : <strong>${shield.name}</strong><br>
      Durée : jusqu'au début de ton prochain tour ou jusqu'au Shield Block.
    `
  );

  return { shield, effect };
}

export async function createBloodShieldItem(actor, spent) {
  const bonus = getBloodShieldACBonus(spent);
  const hardness = getBloodShieldHardness(spent);
  const hp = getBloodShieldHP(spent);

  return actor.createEmbeddedDocuments("Item", [{
    name: "Blood Shield",
    type: "shield",
    img: "systems/pf2e/icons/equipment/shields/steel-shield.webp",
    system: {
      baseItem: "steel-shield",
      traits: {
        otherTags: [],
        value: ["magical"],
        rarity: "rare",
        integrated: null,
        config: {}
      },
      equipped: {
        carryType: "held",
        handsHeld: 1
      },
      acBonus: bonus,
      speedPenalty: 0,
      hardness,
      hp: {
        value: hp,
        max: hp,
        brokenThreshold: Math.floor(hp / 2)
      },
      bulk: {
        heldOrStowed: 0,
        value: 0,
        per: 1
      },
      rules: []
    },
    flags: {
      [MODULE_ID]: {
        type: BLOOD_SHIELD_TYPE,
        spent,
        acBonus: bonus,
        hardness,
        hp
      }
    }
  }]);
}
export async function createBloodShieldEffect(actor, spent, shield = null) {
  const bonus = getBloodShieldACBonus(spent);
  const hardness = getBloodShieldHardness(spent);

  return actor.createEmbeddedDocuments("Item", [{
    name: "Blood Shield Aura",
    type: "effect",
    img: "systems/pf2e/icons/equipment/shields/steel-shield.webp",
    system: {
      duration: {
        value: 1,
        unit: "rounds",
        expiry: "turn-start"
      },
      rules: [{
        key: "FlatModifier",
        selector: "ac",
        type: "circumstance",
        value: bonus,
        label: "Blood Shield"
      }]
    },
    flags: {
      [MODULE_ID]: {
        type: BLOOD_SHIELD_EFFECT_TYPE,
        bloodShield: true,
        spent,
        acBonus: bonus,
        hardness,
        shieldId: shield?.id ?? null
      }
    }
  }]);
}

export async function removeBloodShieldEffect(actor) {
  const effects = getBloodShieldEffects(actor);

  if (!effects.length) return;

  await actor.deleteEmbeddedDocuments("Item", effects.map((effect) => effect.id));
}

export async function removeBloodShieldItems(actor) {
  const shields = getBloodShieldItems(actor);

  if (!shields.length) return;

  await actor.deleteEmbeddedDocuments("Item", shields.map((shield) => shield.id));
}

export async function removeBloodShield(actor) {
  await removeBloodShieldEffect(actor);
  await removeBloodShieldItems(actor);
}

/**
 * À appeler plus tard quand on détectera un Shield Block.
 * Pour l’instant, cette fonction permet de nettoyer manuellement.
 */
export async function consumeBloodShield(actor) {
  const shields = getBloodShieldItems(actor);
  const effects = getBloodShieldEffects(actor);

  if (!shields.length && !effects.length) {
    ui.notifications.warn("Aucun Blood Shield actif.");
    return;
  }

  await removeBloodShield(actor);

  postToChat(actor, "Blood Shield se dissipe après le Shield Block.");
}