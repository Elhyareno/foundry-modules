import { MODULE_ID } from "../constants.js";
import { hasTransfusion, assertSanguimancerFeat } from "../feats.js";
import { postToChat } from "../chat.js";

export function getTransfusionValue(spent) {
  const amount = Number(spent);
  if (!Number.isFinite(amount) || amount < 5) return 0;

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
  const fastHealing = Number(value);

  if (!target || !Number.isFinite(fastHealing) || fastHealing <= 0) {
    ui.notifications.warn("Impossible de créer l'effet Transfusion.");
    return [];
  }

  return target.createEmbeddedDocuments("Item", [{
    name: `Transfusion (${fastHealing})`,
    type: "effect",
    img: "icons/magic/life/heart-cross-strong-red.webp",
    system: {
      slug: "transfusion",
      tokenIcon: {
        show: true,
      },
      duration: {
        value: 5,
        unit: "rounds",
        expiry: "turn-start",
      },
      rules: [],
    },
    flags: {
      [MODULE_ID]: {
        type: "transfusion",
        transfusion: true,
        fastHealing,
        sourceActorUuid: sourceActor?.uuid ?? null,
        sourceActorId: sourceActor?.id ?? null,
        lastAppliedRound: null,
        lastAppliedTurn: null,
      },
    },
  }]);
}

export function getTransfusionEffects(actor) {
  const effects = actor?.itemTypes?.effect ?? [];

  return effects.filter((effect) => {
    const moduleFlag = effect.flags?.[MODULE_ID] ?? {};

    const flagType = effect.getFlag?.(MODULE_ID, "type");
    const flagTransfusion = effect.getFlag?.(MODULE_ID, "transfusion");
    const flagFastHealing = Number(effect.getFlag?.(MODULE_ID, "fastHealing") ?? 0);

    const name = String(effect.name ?? "").toLowerCase();
    const slug = String(effect.slug ?? effect.system?.slug ?? "").toLowerCase();

    return (
      flagType === "transfusion"
      || flagTransfusion === true
      || moduleFlag.type === "transfusion"
      || moduleFlag.transfusion === true
      || flagFastHealing > 0
      || slug === "transfusion"
      || name.includes("transfusion")
    );
  });
}

export async function applyTransfusionHealing(actor, combat = game.combat) {
  if (!actor) return;

  const effects = getTransfusionEffects(actor);

  if (!effects.length) {
    console.debug(`${MODULE_ID} | Aucun effet Transfusion trouvé sur ${actor.name}.`);
    return;
  }

  const round = combat?.round ?? null;
  const turn = combat?.turn ?? null;

  let total = 0;
  const effectsToMark = [];

  for (const effect of effects) {
    const lastRound = effect.getFlag?.(MODULE_ID, "lastAppliedRound");
    const lastTurn = effect.getFlag?.(MODULE_ID, "lastAppliedTurn");

    if (round !== null && turn !== null && lastRound === round && lastTurn === turn) {
      continue;
    }

    const moduleFlag = effect.flags?.[MODULE_ID] ?? {};
    const flagFastHealing = Number(effect.getFlag?.(MODULE_ID, "fastHealing") ?? moduleFlag.fastHealing ?? 0);

    let fastHealing = flagFastHealing;

    if (!Number.isFinite(fastHealing) || fastHealing <= 0) {
      const match = String(effect.name ?? "").match(/\((\d+)\)/);
      fastHealing = match ? Number(match[1]) : 0;
    }

    if (Number.isFinite(fastHealing) && fastHealing > 0) {
      total += fastHealing;
      effectsToMark.push(effect);
    }
  }

  if (total <= 0) return;

  const hp = actor.system.attributes.hp;
  const current = Number(hp.value ?? 0);
  const max = Number(hp.max ?? 0);
  const heal = Math.min(total, Math.max(0, max - current));

  for (const effect of effectsToMark) {
    await effect.setFlag(MODULE_ID, "lastAppliedRound", round);
    await effect.setFlag(MODULE_ID, "lastAppliedTurn", turn);
  }

  if (heal > 0) {
    await actor.update({
      "system.attributes.hp.value": current + heal,
    });

    postToChat(actor, `Transfusion +${heal} PV`);
  }
}