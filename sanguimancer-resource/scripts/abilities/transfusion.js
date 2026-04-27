import { MODULE_ID } from "../constants.js";
import { hasTransfusion, assertSanguimancerFeat } from "../feats.js";
import { postToChat } from "../chat.js";

const TRANSFUSION_SLUG = "sanguimancer-transfusion";

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
      Régénération ${fastHealing} pendant 5 rounds.
    `
  );

  return effect;
}

export async function createTransfusionEffect(target, value, sourceActor = null) {
  if (!target) {
    ui.notifications.warn("Aucune cible pour Transfusion.");
    return [];
  }

  const fastHealing = Number(value);

  if (!Number.isFinite(fastHealing) || fastHealing <= 0) {
    ui.notifications.warn("Valeur de Transfusion invalide.");
    return [];
  }

  const effectData = {
    name: `Transfusion (${fastHealing})`,
    type: "effect",
    img: "icons/magic/life/heart-area-circle-red-green.webp",
    system: {
      slug: TRANSFUSION_SLUG,
      description: {
        value: `<p>Régénération ${fastHealing} accordée par Transfusion.</p>`,
      },
      duration: {
        value: 5,
        unit: "rounds",
        expiry: "turn-start",
        sustained: false,
      },
      tokenIcon: {
        show: true,
      },
      unidentified: false,
      start: {
        value: 0,
        initiative: null,
      },
      badge: {
        type: "counter",
        value: fastHealing,
      },
      traits: {
        value: [],
        rarity: "common",
        otherTags: [],
      },
      rules: [],
    },
    flags: {
      [MODULE_ID]: {
        type: "transfusion",
        transfusion: true,
        fastHealing,
        sourceActorId: sourceActor?.id ?? null,
        sourceActorUuid: sourceActor?.uuid ?? null,
        lastAppliedRound: null,
        lastAppliedTurn: null,
      },
    },
  };

  const created = await target.createEmbeddedDocuments("Item", [effectData]);

  console.log(`${MODULE_ID} | Transfusion effect created`, {
    target: target.name,
    fastHealing,
    created,
    flags: created[0]?.flags,
    system: created[0]?.system,
  });

  return created;
}

export function getTransfusionEffects(actor) {
  const effects = actor?.itemTypes?.effect ?? [];

  const found = effects.filter((effect) => {
    const moduleFlags = effect.flags?.[MODULE_ID] ?? {};
    const flagType = effect.getFlag?.(MODULE_ID, "type");
    const flagTransfusion = effect.getFlag?.(MODULE_ID, "transfusion");
    const flagFastHealing = Number(effect.getFlag?.(MODULE_ID, "fastHealing") ?? moduleFlags.fastHealing ?? 0);

    const name = String(effect.name ?? "").toLowerCase();
    const slug = String(effect.slug ?? effect.system?.slug ?? "").toLowerCase();

    return (
      flagType === "transfusion"
      || flagTransfusion === true
      || moduleFlags.type === "transfusion"
      || moduleFlags.transfusion === true
      || flagFastHealing > 0
      || slug === TRANSFUSION_SLUG
      || name.startsWith("transfusion")
    );
  });

  console.log(`${MODULE_ID} | getTransfusionEffects`, {
    actor: actor?.name,
    allEffects: effects.map((effect) => ({
      name: effect.name,
      slug: effect.slug ?? effect.system?.slug,
      flags: effect.flags?.[MODULE_ID],
    })),
    found: found.map((effect) => ({
      name: effect.name,
      slug: effect.slug ?? effect.system?.slug,
      flags: effect.flags?.[MODULE_ID],
    })),
  });

  return found;
}

export async function applyTransfusionHealing(actor, combat = game.combat) {
  if (!actor) return;

  const effects = getTransfusionEffects(actor);

  if (!effects.length) {
    console.warn(`${MODULE_ID} | Aucun effet Transfusion trouvé sur ${actor.name}.`);
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

    const moduleFlags = effect.flags?.[MODULE_ID] ?? {};
    let fastHealing = Number(effect.getFlag?.(MODULE_ID, "fastHealing") ?? moduleFlags.fastHealing ?? 0);

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

  if (heal <= 0) {
    console.log(`${MODULE_ID} | Transfusion : aucune guérison nécessaire`, {
      actor: actor.name,
      current,
      max,
      total,
    });
    return;
  }

  await actor.update({
    "system.attributes.hp.value": current + heal,
  });

  postToChat(actor, `Transfusion +${heal} PV`);

  console.log(`${MODULE_ID} | Transfusion healing applied`, {
    actor: actor.name,
    before: current,
    after: current + heal,
    heal,
    total,
  });
}