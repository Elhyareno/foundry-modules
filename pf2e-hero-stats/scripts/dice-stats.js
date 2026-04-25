import {
  MODULE_ID,
  createDefaultStatsData,
  getSetting,
  setSetting
} from "./settings.js";

import {
  duplicateData,
  getDegreeOfSuccess,
  getMessageActor,
  getNaturalD20FromRoll,
  getRollType,
  normalizeOutcome,
  nowIso,
  shouldIgnoreMessage
} from "./utils.js";

/* =========================
   Initialisation
========================= */

export function initDiceStats() {
  const current = getStatsData();

  if (!current || !current.actors || !current.totals) {
    setStatsData(createDefaultStatsData());
  }
}

/* =========================
   Accès aux données
========================= */

export function getStatsData() {
  return getSetting("statsData") ?? createDefaultStatsData();
}

export async function setStatsData(data) {
  return setSetting("statsData", data);
}

function getOrCreateActorStats(data, actor) {
  if (!data.actors[actor.id]) {
    data.actors[actor.id] = {
      actorId: actor.id,
      name: actor.name,

      totalRolls: 0,
      d20Total: 0,

      natural1: 0,
      natural20: 0,

      criticalSuccesses: 0,
      successes: 0,
      failures: 0,
      criticalFailures: 0,

      highestNatural: null,
      lowestNatural: null,

      byType: {
        attack: 0,
        save: 0,
        skill: 0,
        perception: 0,
        flat: 0,
        other: 0
      },

      streak: {
        failures: 0,
        criticalFailures: 0,
        successes: 0
      },

      rolls: []
    };
  }

  // Si le nom de l'acteur change, on garde la stat vivante.
  data.actors[actor.id].name = actor.name;

  return data.actors[actor.id];
}

/* =========================
   Enregistrement principal
========================= */

export async function recordDiceRoll(message, roll) {
  if (!getSetting("trackDiceStats")) return;
  if (!message || !roll) return;

  const actor = getMessageActor(message);
  if (shouldIgnoreMessage(message, actor)) return;

  const rollType = getRollType(message);

  if (getSetting("ignoreFlatChecks") && rollType === "flat") {
    return;
  }

  const naturalD20 = getNaturalD20FromRoll(roll);
  if (naturalD20 === null) return;

  const rawOutcome = getDegreeOfSuccess(message);
  const outcome = normalizeOutcome(rawOutcome);

  const data = duplicateData(getStatsData());
  const actorStats = getOrCreateActorStats(data, actor);

  applyRollStats(data, actorStats, {
    actor,
    message,
    roll,
    rollType,
    naturalD20,
    outcome
  });

  await setStatsData(data);
}

/* =========================
   Application des stats
========================= */

function applyRollStats(data, actorStats, rollData) {
  const {
    message,
    roll,
    rollType,
    naturalD20,
    outcome
  } = rollData;

  actorStats.totalRolls += 1;
  actorStats.d20Total += naturalD20;

  data.totals.rolls += 1;

  actorStats.byType[rollType] = (actorStats.byType[rollType] ?? 0) + 1;

  if (naturalD20 === 1) {
    actorStats.natural1 += 1;
    data.totals.natural1 += 1;
  }

  if (naturalD20 === 20) {
    actorStats.natural20 += 1;
    data.totals.natural20 += 1;
  }

  if (actorStats.highestNatural === null || naturalD20 > actorStats.highestNatural) {
    actorStats.highestNatural = naturalD20;
  }

  if (actorStats.lowestNatural === null || naturalD20 < actorStats.lowestNatural) {
    actorStats.lowestNatural = naturalD20;
  }

  applyOutcomeStats(data, actorStats, outcome);

  actorStats.rolls.push({
    timestamp: nowIso(),
    messageId: message.id,
    formula: roll.formula,
    total: roll.total,
    naturalD20,
    rollType,
    outcome
  });
}

function applyOutcomeStats(data, actorStats, outcome) {
  if (!outcome) return;

  switch (outcome) {
    case "criticalSuccess":
      actorStats.criticalSuccesses += 1;
      data.totals.criticalSuccesses += 1;
      actorStats.streak.successes += 1;
      actorStats.streak.failures = 0;
      actorStats.streak.criticalFailures = 0;
      break;

    case "success":
      actorStats.successes += 1;
      data.totals.successes += 1;
      actorStats.streak.successes += 1;
      actorStats.streak.failures = 0;
      actorStats.streak.criticalFailures = 0;
      break;

    case "failure":
      actorStats.failures += 1;
      data.totals.failures += 1;
      actorStats.streak.failures += 1;
      actorStats.streak.successes = 0;
      actorStats.streak.criticalFailures = 0;
      break;

    case "criticalFailure":
      actorStats.criticalFailures += 1;
      data.totals.criticalFailures += 1;
      actorStats.streak.failures += 1;
      actorStats.streak.criticalFailures += 1;
      actorStats.streak.successes = 0;
      break;
  }
}

/* =========================
   Lecture / résumé
========================= */

export function getDiceStats() {
  const data = getStatsData();

  const actors = Object.values(data.actors ?? {}).map(actorStats => {
    const total = actorStats.totalRolls || 0;
    const averageD20 = total > 0
      ? Number((actorStats.d20Total / total).toFixed(2))
      : 0;

    const resolvedRolls =
      actorStats.criticalSuccesses +
      actorStats.successes +
      actorStats.failures +
      actorStats.criticalFailures;

    const successRate = resolvedRolls > 0
      ? Number((((actorStats.successes + actorStats.criticalSuccesses) / resolvedRolls) * 100).toFixed(2))
      : 0;

    return {
      ...actorStats,
      averageD20,
      successRate
    };
  });

  const resolvedTotal =
    data.totals.criticalSuccesses +
    data.totals.successes +
    data.totals.failures +
    data.totals.criticalFailures;

  const globalSuccessRate = resolvedTotal > 0
    ? Number((((data.totals.successes + data.totals.criticalSuccesses) / resolvedTotal) * 100).toFixed(2))
    : 0;

  return {
    ...data,
    actors,
    total: data.totals.rolls,
    successRate: globalSuccessRate,
    successes: data.totals.successes,
    criticalSuccesses: data.totals.criticalSuccesses,
    failures: data.totals.failures,
    criticalFailures: data.totals.criticalFailures,
    natural1: data.totals.natural1,
    natural20: data.totals.natural20
  };
}

/* =========================
   Reset
========================= */

export async function resetDiceStats() {
  await setStatsData(createDefaultStatsData());
}