import { MODULE_ID } from "../constants.js";
import { hasTransfusion, assertSanguimancerFeat } from "../feats.js";
import { postToChat } from "../chat.js";

export function getTransfusionValue(spent) {
  const amount = Number(spent);
  if (amount < 5) return 0;

  return Math.min(1 + Math.floor((amount - 5) / 5), 8);
}

export async function useTransfusion(actor, target, spent) {
  if (!assertSanguimancerFeat(actor, hasTransfusion, "Don Transfusion manquant.")) return null;

  const amount = Number(spent);

  if (!Number.isFinite(amount) || amount < 5) {
    ui.notifications.warn("Transfusion demande au moins 5 PV sanguimanciens.");
    return null;
  }

  const fastHealing = getTransfusionValue(amount);

  if (fastHealing <= 0) {
    ui.notifications.warn("Montant de Transfusion invalide.");
    return null;
  }

  const state = await game.sanguimancer.getState(actor);

  if (state.current < amount) {
    ui.notifications.warn("Pas assez de PV sanguimanciens pour Transfusion.");
    return null;
  }

  const selectedTarget = target ?? actor;

  await game.sanguimancer.spendResource(actor, amount, "Transfusion");

  const [effect] = await createTransfusionEffect(selectedTarget, fastHealing, actor);

  postToChat(
    actor,
    `
      Transfusion accordée à <strong>${selectedTarget.name}</strong>.<br>
      Fast Healing ${fastHealing} pendant 5 rounds.
    `
  );

  return effect;
}

export async function createTransfusionEffect(target, value, sourceActor = null) {
  return target.createEmbeddedDocuments("Item", [{
    name: `Transfusion (${value})`,
    type: "effect",
    system: {
      duration: {
        value: 5,
        unit: "rounds",
        expiry: "turn-end",
      },
    },
    flags: {
      [MODULE_ID]: {
        type: "transfusion",
        transfusion: true,
        fastHealing: value,
        sourceActorId: sourceActor?.id ?? null,
        lastAppliedRound: null,
        lastAppliedTurn: null,
      },
    },
  }]);
}

export function getTransfusionEffects(actor) {
  return actor.itemTypes?.effect?.filter(
    (effect) => effect.getFlag(MODULE_ID, "transfusion")
      || effect.getFlag(MODULE_ID, "type") === "transfusion"
  ) ?? [];
}

export async function applyTransfusionHealing(actor, combat = game.combat) {
  const effects = getTransfusionEffects(actor);

  if (!effects.length) return;

  const round = combat?.round ?? null;
  const turn = combat?.turn ?? null;

  let total = 0;
  const effectsToMark = [];

  for (const effect of effects) {
    const lastRound = effect.getFlag(MODULE_ID, "lastAppliedRound");
    const lastTurn = effect.getFlag(MODULE_ID, "lastAppliedTurn");

    if (round !== null && turn !== null && lastRound === round && lastTurn === turn) {
      continue;
    }

    total += Number(effect.getFlag(MODULE_ID, "fastHealing") ?? 0);
    effectsToMark.push(effect);
  }

  if (total <= 0) return;

  const hp = actor.system.attributes.hp;
  const heal = Math.min(total, hp.max - hp.value);

  for (const effect of effectsToMark) {
    await effect.setFlag(MODULE_ID, "lastAppliedRound", round);
    await effect.setFlag(MODULE_ID, "lastAppliedTurn", turn);
  }

  if (heal > 0) {
    await actor.update({
      "system.attributes.hp.value": hp.value + heal,
    });

    postToChat(actor, `Transfusion +${heal} PV`);
  }
}