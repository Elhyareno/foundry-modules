const MODULE_ID = "sanguimancer-resource";

// =========================
// INIT API
// =========================

export function initSanguimancerAPI() {
  game.sanguimancer = {
    hasDedication,
    hasFeat,
    hasBloodShield,
    hasExsanguinate,
    hasTransfusion,
    hasVenipuncture,
    assertSanguimancerFeat,

    getState,
    changeResource,
    gainResource,
    spendResource,
    reconcileAfterDamage,
    syncTHPFromFlagIfNeeded,
    onFullRest,
    postToChat,

    getBestDC,
    createBloodShieldEffect,
    removeBloodShieldEffect,
    createTransfusionEffect,
    getTransfusionEffects,
    applyTransfusionHealing,

    addTemporaryResource,
    cleanupExpiredTemporaryResources,
    getTemporaryResourceData,
  };
}

// =========================
// UTILS
// =========================

function getLevel(actor) {
  return actor.level ?? actor.system?.details?.level?.value ?? 0;
}

function getMax(actor) {
  return getLevel(actor) * 2;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getTHP(actor) {
  return actor.system?.attributes?.hp?.temp ?? 0;
}

// =========================
// FEATS
// =========================

function hasDedication(actor) {
  return actor.itemTypes?.feat?.some(f => {
    const slug = (f.slug ?? f.system?.slug ?? "").toLowerCase();
    const name = (f.name ?? "").toLowerCase();
    return slug.includes("sanguimancer") || name.includes("sanguimancien");
  });
}

function hasFeat(actor, terms = []) {
  return actor.itemTypes?.feat?.some(f => {
    const slug = (f.slug ?? f.system?.slug ?? "").toLowerCase();
    const name = (f.name ?? "").toLowerCase();
    return terms.some(t => slug.includes(t) || name.includes(t));
  });
}

const hasBloodShield = a => hasFeat(a, ["blood shield"]);
const hasExsanguinate = a => hasFeat(a, ["exsanguinate"]);
const hasTransfusion = a => hasFeat(a, ["transfusion"]);
const hasVenipuncture = a => hasFeat(a, ["venipuncture"]);

function assertSanguimancerFeat(actor, check, error) {
  if (!actor) return false;
  if (!hasDedication(actor)) {
    ui.notifications.warn("Pas sanguimancien");
    return false;
  }
  if (check && !check(actor)) {
    ui.notifications.warn(error);
    return false;
  }
  return true;
}

// =========================
// STATE
// =========================

async function getState(actor) {
  const data = actor.getFlag(MODULE_ID, "data") ?? {};
  return {
    current: data.current ?? 0,
    max: getMax(actor),
    temporaryResources: data.temporaryResources ?? []
  };
}

async function setState(actor, current, extra = {}) {
  await actor.setFlag(MODULE_ID, "data", {
    current: clamp(current, 0, getMax(actor)),
    ...extra
  });
}

// =========================
// THP
// =========================

async function applyTHPDelta(actor, delta) {
  const thp = getTHP(actor);
  await actor.update({
    "system.attributes.hp.temp": Math.max(0, thp + delta)
  });
}

// =========================
// CORE
// =========================

async function changeResource(actor, delta, reason = "") {
  const state = await getState(actor);
  const next = clamp(state.current + delta, 0, state.max);
  const diff = next - state.current;

  if (!diff) return;

  await setState(actor, next, { temporaryResources: state.temporaryResources });
  await applyTHPDelta(actor, diff);

  postToChat(actor, `${reason} (${diff}) → ${next}/${state.max}`);
}

const gainResource = (a, v, r) => changeResource(a, v, r);
const spendResource = async (a, v, r) => {
  const s = await getState(a);
  if (s.current < v) return ui.notifications.warn("Pas assez de ressource");
  return changeResource(a, -v, r);
};

// =========================
// DAMAGE
// =========================

async function reconcileAfterDamage(actor) {
  const state = await getState(actor);
  const thp = getTHP(actor);
  if (thp < state.current) {
    await setState(actor, thp, { temporaryResources: state.temporaryResources });
  }
}

// =========================
// SYNC
// =========================

async function syncTHPFromFlagIfNeeded(actor) {
  const state = await getState(actor);
  const thp = getTHP(actor);

  if (thp < state.current) {
    await applyTHPDelta(actor, state.current - thp);
  }
}

// =========================
// REST (RESET)
// =========================

async function onFullRest(actor) {
  const target = getLevel(actor);
  const thp = getTHP(actor);

  await setState(actor, target, { temporaryResources: [] });

  await applyTHPDelta(actor, target - thp);

  postToChat(actor, `Repos → ${target}`);
}

// =========================
// DC
// =========================

function getBestDC(actor) {
  return Math.max(
    actor.system?.attributes?.classDC?.value ?? 0,
    actor.system?.attributes?.spellDC?.value ?? 0
  );
}

// =========================
// BLOOD SHIELD
// =========================

async function createBloodShieldEffect(actor, spent) {
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

async function removeBloodShieldEffect(actor) {
  const effects = actor.itemTypes.effect.filter(e => e.getFlag(MODULE_ID, "bloodShield"));
  if (effects.length) {
    await actor.deleteEmbeddedDocuments("Item", effects.map(e => e.id));
  }
}

// =========================
// TRANSFUSION
// =========================

async function createTransfusionEffect(target, value) {
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

function getTransfusionEffects(actor) {
  return actor.itemTypes.effect.filter(e => e.getFlag(MODULE_ID, "transfusion"));
}

async function applyTransfusionHealing(actor) {
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

// =========================
// TEMP RESOURCES
// =========================

async function addTemporaryResource(actor, amount, source, round) {
  const state = await getState(actor);

  const entry = {
    amount,
    expires: round
  };

  const temp = [...state.temporaryResources, entry];

  await setState(actor, state.current + amount, { temporaryResources: temp });
  await applyTHPDelta(actor, amount);
}

async function cleanupExpiredTemporaryResources(actor) {
  const state = await getState(actor);
  if (!game.combat) return;

  const round = game.combat.round;

  const remaining = state.temporaryResources.filter(e => e.expires > round);
  const lost = state.temporaryResources.length - remaining.length;

  if (lost > 0) {
    const newVal = Math.max(0, state.current - lost);
    await setState(actor, newVal, { temporaryResources: remaining });

    if (getTHP(actor) > newVal) {
      await actor.update({ "system.attributes.hp.temp": newVal });
    }
  }
}

function getTemporaryResourceData(actor) {
  return actor.getFlag(MODULE_ID, "data")?.temporaryResources ?? [];
}

// =========================
// CHAT
// =========================

function postToChat(actor, msg) {
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<strong>Sanguimancie</strong><br>${msg}`
  });
}