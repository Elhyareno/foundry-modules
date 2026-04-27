import {
  MODULE_ID,
  FLAG_DATA,
  getLevel,
  getMax,
  clamp,
  getTHP,
  getBestDC,
  randomId,
} from "./constants.js";

import {
  hasDedication,
  hasFeat,
  hasBloodShield,
  hasExsanguinate,
  hasTransfusion,
  hasVenipuncture,
  assertSanguimancerFeat,
} from "./feats.js";

import { postToChat, postPrivateToActor } from "./chat.js";

import {
  createBloodShieldEffect,
  removeBloodShieldEffect,
  useBloodShield,
} from "./abilities/blood-shield.js";

import {
  createTransfusionEffect,
  getTransfusionEffects,
  applyTransfusionHealing,
  useTransfusion,
} from "./abilities/transfusion.js";

import {
  useExsanguinate,
  setExsanguinateOpportunity,
  clearExsanguinateOpportunity,
  getExsanguinateOpportunity,
} from "./abilities/exsanguinate.js";

import {
  useVenipuncture,
} from "./abilities/venipuncture.js";

function calculateCurrent(baseCurrent, temporaryResources) {
  const temporaryTotal = temporaryResources.reduce(
    (sum, resource) => sum + Number(resource.remaining ?? 0),
    0
  );

  return baseCurrent + temporaryTotal;
}

function normalizeTemporaryResources(resources = []) {
  return resources
    .map((resource) => ({
      id: resource.id ?? randomId(),
      amount: Number(resource.amount ?? resource.remaining ?? 0),
      remaining: Number(resource.remaining ?? resource.amount ?? 0),
      source: resource.source ?? "unknown",
      expiresRound: Number(resource.expiresRound ?? resource.expires ?? 0),
      expiresTurn: Number(resource.expiresTurn ?? -1),
    }))
    .filter((resource) => resource.remaining > 0);
}

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
    setState,
    changeResource,
    gainResource,
    spendResource,
    spendAllResource,
    reconcileAfterDamage,
    syncTHPFromFlagIfNeeded,
    onFullRest,
    postToChat,
    postPrivateToActor,

    getBestDC,

    createBloodShieldEffect,
    removeBloodShieldEffect,
    useBloodShield,

    createTransfusionEffect,
    getTransfusionEffects,
    applyTransfusionHealing,
    useTransfusion,

    useExsanguinate,
    setExsanguinateOpportunity,
    clearExsanguinateOpportunity,
    getExsanguinateOpportunity,

    useVenipuncture,

    addTemporaryResource,
    cleanupExpiredTemporaryResources,
    getTemporaryResourceData,
  };
}

export async function getState(actor) {
  const data = actor.getFlag(MODULE_ID, FLAG_DATA) ?? {};

  const migratedBase = data.baseCurrent ?? data.current ?? 0;
  const temporaryResources = normalizeTemporaryResources(data.temporaryResources ?? []);

  const baseCurrent = clamp(Number(migratedBase), 0, getMax(actor));
  const max = getMax(actor);
  const current = clamp(calculateCurrent(baseCurrent, temporaryResources), 0, max);

  return {
    baseCurrent,
    current,
    max,
    temporaryResources,
  };
}

export async function setState(actor, state) {
  const max = getMax(actor);
  const temporaryResources = normalizeTemporaryResources(state.temporaryResources ?? []);

  const tempTotal = temporaryResources.reduce(
    (sum, resource) => sum + Number(resource.remaining ?? 0),
    0
  );

  const baseMax = Math.max(0, max - tempTotal);
  const baseCurrent = clamp(Number(state.baseCurrent ?? 0), 0, baseMax);

  await actor.setFlag(MODULE_ID, FLAG_DATA, {
    baseCurrent,
    temporaryResources,
  });

  return getState(actor);
}

async function applyTHPDelta(actor, delta) {
  const thp = getTHP(actor);
  const next = Math.max(0, thp + delta);

  await actor.update({
    "system.attributes.hp.temp": next,
  });
}

async function distributeLoss(state, amount) {
  let remainingLoss = Number(amount ?? 0);
  let baseCurrent = state.baseCurrent;
  const temporaryResources = [...state.temporaryResources];

  for (let index = temporaryResources.length - 1; index >= 0; index -= 1) {
    if (remainingLoss <= 0) break;

    const resource = temporaryResources[index];
    const loss = Math.min(resource.remaining, remainingLoss);

    resource.remaining -= loss;
    remainingLoss -= loss;
  }

  const cleanedTemporaryResources = temporaryResources.filter((resource) => resource.remaining > 0);

  if (remainingLoss > 0) {
    const loss = Math.min(baseCurrent, remainingLoss);
    baseCurrent -= loss;
    remainingLoss -= loss;
  }

  return {
    baseCurrent,
    temporaryResources: cleanedTemporaryResources,
  };
}

export async function changeResource(actor, delta, reason = "") {
  const state = await getState(actor);
  const max = state.max;

  if (delta > 0) {
    const available = max - state.current;
    const gain = Math.min(Number(delta), available);
    if (gain <= 0) return state;

    const nextState = await setState(actor, {
      baseCurrent: state.baseCurrent + gain,
      temporaryResources: state.temporaryResources,
    });

    await applyTHPDelta(actor, gain);
    postToChat(actor, `${reason} (+${gain}) → ${nextState.current}/${nextState.max}`);

    return nextState;
  }

  if (delta < 0) {
    const spend = Math.min(Math.abs(Number(delta)), state.current);
    if (spend <= 0) return state;

    const distributed = await distributeLoss(state, spend);

    const nextState = await setState(actor, distributed);

    await applyTHPDelta(actor, -spend);
    postToChat(actor, `${reason} (-${spend}) → ${nextState.current}/${nextState.max}`);

    return nextState;
  }

  return state;
}

export const gainResource = (actor, value, reason) => changeResource(actor, value, reason);

export async function spendResource(actor, value, reason = "") {
  const state = await getState(actor);
  const amount = Number(value);

  if (state.current < amount) {
    ui.notifications.warn("Pas assez de PV sanguimanciens.");
    return null;
  }

  return changeResource(actor, -amount, reason);
}

export async function spendAllResource(actor, reason = "") {
  const state = await getState(actor);

  if (state.current <= 0) return {
    spent: 0,
    state,
  };

  const spent = state.current;
  const nextState = await setState(actor, {
    baseCurrent: 0,
    temporaryResources: [],
  });

  await applyTHPDelta(actor, -spent);
  postToChat(actor, `${reason} (-${spent}) → ${nextState.current}/${nextState.max}`);

  return {
    spent,
    state: nextState,
  };
}

/**
 * Les PV temporaires sanguimanciens sont perdus en dernier.
 * Les PV temp visibles peuvent inclure des sources externes.
 * Si les PV temp visibles tombent sous la valeur sanguimancienne,
 * on réduit la réserve sanguimancienne pour rester borné par la fiche.
 */
export async function reconcileAfterDamage(actor) {
  const state = await getState(actor);
  const thp = getTHP(actor);

  if (thp >= state.current) return state;

  const loss = state.current - thp;
  const distributed = await distributeLoss(state, loss);

  return setState(actor, distributed);
}

export async function syncTHPFromFlagIfNeeded(actor) {
  const state = await getState(actor);
  const thp = getTHP(actor);

  if (thp < state.current) {
    await applyTHPDelta(actor, state.current - thp);
  }

  return getState(actor);
}

export async function onFullRest(actor) {
  const target = getLevel(actor);
  const state = await getState(actor);
  const current = state.current;

  const nextState = await setState(actor, {
    baseCurrent: target,
    temporaryResources: [],
  });

  await applyTHPDelta(actor, target - current);

  postToChat(actor, `Repos → ${nextState.current}/${nextState.max}`);

  return nextState;
}

export async function addTemporaryResource(actor, amount, source = "temporary", expiration = {}) {
  const state = await getState(actor);
  const max = state.max;

  const value = Math.max(0, Number(amount ?? 0));
  const available = max - state.current;
  const gained = Math.min(value, available);

  if (gained <= 0) return state;

  const combat = game.combat;
  const entry = {
    id: randomId(),
    amount: gained,
    remaining: gained,
    source,
    expiresRound: Number(expiration.expiresRound ?? combat?.round ?? 0),
    expiresTurn: Number(expiration.expiresTurn ?? -1),
  };

  const nextState = await setState(actor, {
    baseCurrent: state.baseCurrent,
    temporaryResources: [...state.temporaryResources, entry],
  });

  await applyTHPDelta(actor, gained);

  postToChat(actor, `${source} (+${gained} temporaire) → ${nextState.current}/${nextState.max}`);

  return nextState;
}

function isTemporaryExpired(resource, combat) {
  if (!combat) return false;

  const round = Number(combat.round ?? 0);
  const turn = Number(combat.turn ?? -1);

  if (resource.expiresRound <= 0) return false;

  if (round > resource.expiresRound) return true;
  if (round < resource.expiresRound) return false;

  if (resource.expiresTurn < 0) return true;

  return turn > resource.expiresTurn;
}

export async function cleanupExpiredTemporaryResources(actor) {
  const state = await getState(actor);
  const combat = game.combat;

  if (!combat) return state;

  const expired = state.temporaryResources.filter((resource) => isTemporaryExpired(resource, combat));
  const remaining = state.temporaryResources.filter((resource) => !isTemporaryExpired(resource, combat));

  const lost = expired.reduce((sum, resource) => sum + Number(resource.remaining ?? 0), 0);

  if (lost <= 0) return state;

  const nextState = await setState(actor, {
    baseCurrent: state.baseCurrent,
    temporaryResources: remaining,
  });

  await applyTHPDelta(actor, -lost);

  postToChat(actor, `Ressource temporaire expirée (-${lost}) → ${nextState.current}/${nextState.max}`);

  return nextState;
}

export function getTemporaryResourceData(actor) {
  return actor.getFlag(MODULE_ID, FLAG_DATA)?.temporaryResources ?? [];
}