import { MODULE_ID, getLevel, getMax, clamp, getTHP, getBestDC } from "./constants.js";
import {
  hasDedication,
  hasFeat,
  hasBloodShield,
  hasExsanguinate,
  hasTransfusion,
  hasVenipuncture,
  assertSanguimancerFeat
} from "./feats.js";
import { postToChat } from "./chat.js";
import { createBloodShieldEffect, removeBloodShieldEffect } from "./abilities/blood-shield.js";
import { createTransfusionEffect, getTransfusionEffects, applyTransfusionHealing } from "./abilities/transfusion.js";

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