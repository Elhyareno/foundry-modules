import { FCoreChat } from "../../lib-foundry-core/scripts/index.js";
import { PF2eResources } from "../../lib-pf2e-tools/scripts/index.js";

import {
  createDefaultHeroLog,
  getSetting,
  setSetting
} from "./settings.js";

import {
  duplicateData,
  nowIso
} from "./utils.js";

const HERO_POINTS_PATH = "system.resources.heroPoints.value";
const HERO_POINTS_MAX_PATH = "system.resources.heroPoints.max";

export function initHeroPoints() {
  const current = getHeroPointLog();

  if (!current || !Array.isArray(current.entries)) {
    setHeroPointLog(createDefaultHeroLog());
  }

  setupHeroPointActorListener();
}

export function getHeroPointLog() {
  return getSetting("heroPointLog") ?? createDefaultHeroLog();
}

export async function setHeroPointLog(data) {
  return setSetting("heroPointLog", data);
}

export function getHeroPointsLog() {
  return getHeroPointLog().entries ?? [];
}

export function getHeroPoints(actor) {
  return Number(PF2eResources.get(actor, HERO_POINTS_PATH) ?? 0);
}

export function getMaxHeroPoints(actor) {
  return Number(PF2eResources.get(actor, HERO_POINTS_MAX_PATH) ?? 3);
}

export function hasHeroPoints(actor) {
  return PF2eResources.get(actor, HERO_POINTS_PATH) !== undefined;
}

function setupHeroPointActorListener() {
  Hooks.on("updateActor", async (actor, changes, options, _userId) => {
    if (options.heroStatsHandled) return;
    if (!getSetting("trackHeroPoints")) return;
    if (!actor || actor.type !== "character") return;

    const newValue = foundry.utils.getProperty(
      changes,
      HERO_POINTS_PATH
    );

    if (newValue === undefined) return;

    const oldValue = getHeroPoints(actor);
    const nextValue = Number(newValue);

    if (Number.isNaN(nextValue)) return;
    if (nextValue === oldValue) return;

    const delta = nextValue - oldValue;

    if (delta > 0) {
      await recordHeroPointChange(actor, delta, "gain", "Gain de point d'héroïsme");
    }

    if (delta < 0) {
      await recordHeroPointChange(actor, Math.abs(delta), "spend", "Dépense de point d'héroïsme");
    }
  });
}

export async function recordHeroPointChange(actor, amount = 1, type = "change", reason = "") {
  if (!actor) return;

  const data = duplicateData(getHeroPointLog());

  data.entries.push({
    actorId: actor.id,
    actorName: actor.name,
    amount,
    type,
    reason,
    timestamp: nowIso()
  });

  await setHeroPointLog(data);
}

export async function recordHeroPointUse(actor, amount = 1, reason = "Point d'héroïsme utilisé") {
  return recordHeroPointChange(actor, amount, "spend", reason);
}

export async function addHeroPoint(actor, amount = 1, reason = "Gain manuel") {
  if (!actor || !hasHeroPoints(actor)) return 0;

  const current = getHeroPoints(actor);
  const max = getMaxHeroPoints(actor);
  const next = Math.min(current + amount, max);
  const delta = next - current;

  if (delta <= 0) return 0;

  await actor.update({
    [HERO_POINTS_PATH]: next
  }, {
    heroStatsHandled: true
  });

  await recordHeroPointChange(actor, delta, "gain", reason);

  return delta;
}

export async function removeHeroPoint(actor, amount = 1, reason = "Dépense manuelle") {
  if (!actor || !hasHeroPoints(actor)) return 0;

  const current = getHeroPoints(actor);
  const next = Math.max(current - amount, 0);
  const delta = current - next;

  if (delta <= 0) return 0;

  await actor.update({
    [HERO_POINTS_PATH]: next
  }, {
    heroStatsHandled: true
  });

  await recordHeroPointChange(actor, delta, "spend", reason);

  return delta;
}

export async function setHeroPoints(actor, value, reason = "Ajustement manuel") {
  if (!actor || !hasHeroPoints(actor)) return 0;

  const current = getHeroPoints(actor);
  const max = getMaxHeroPoints(actor);
  const next = Math.clamp(Number(value), 0, max);

  if (next === current) return 0;

  await actor.update({
    [HERO_POINTS_PATH]: next
  }, {
    heroStatsHandled: true
  });

  const delta = next - current;

  if (delta > 0) {
    await recordHeroPointChange(actor, delta, "gain", reason);
  } else {
    await recordHeroPointChange(actor, Math.abs(delta), "spend", reason);
  }

  return delta;
}

export function getPartyCharacters() {
  return game.actors.filter(actor => {
    if (actor.type !== "character") return false;
    if (!hasHeroPoints(actor)) return false;

    const hasPlayerOwner = game.users.some(user => {
      if (user.isGM) return false;
      return actor.testUserPermission(user, "OWNER");
    });

    return hasPlayerOwner;
  });
}

export async function giveOneHeroPointToParty() {
  const actors = getPartyCharacters();

  let totalGiven = 0;
  const lines = [];

  for (const actor of actors) {
    try {
      const current = getHeroPoints(actor);
      const max = getMaxHeroPoints(actor);

      if (current >= max) {
        lines.push(`<li><strong>${actor.name}</strong> : déjà au maximum (${current}/${max})</li>`);
        continue;
      }

      const given = await addHeroPoint(actor, 1, "Distribution au groupe");
      totalGiven += given;

      lines.push(`<li><strong>${actor.name}</strong> : +${given} (${current} → ${current + given})</li>`);
    } catch (error) {
      console.error("pf2e-hero-stats | Impossible d'ajouter un point d'héroïsme à", actor, error);

      lines.push(`
        <li>
          <strong>${actor.name}</strong> :
          <span style="color: darkred;">erreur pendant l'ajout</span>
        </li>
      `);
    }
  }

  await FCoreChat.send(`
    <section class="hero-stats-report summary">
      <h3>⭐ Points d'héroïsme</h3>
      <p>Les braises du destin se rallument.</p>
      <ul>${lines.join("")}</ul>
      <p>Total distribué : <strong>${totalGiven}</strong></p>
    </section>
  `, {
    whisper: FCoreChat.getGMIds()
  });

  return totalGiven;
}

export async function resetPartyHeroPoints(value = 0) {
  const actors = getPartyCharacters();

  let totalChanged = 0;
  const lines = [];

  for (const actor of actors) {
    try {
      const current = getHeroPoints(actor);
      const changed = await setHeroPoints(actor, value, `Remise à ${value}`);

      totalChanged += Math.abs(changed);

      lines.push(`<li><strong>${actor.name}</strong> : ${current} → ${getHeroPoints(actor)}</li>`);
    } catch (error) {
      console.error("pf2e-hero-stats | Impossible de remettre les points d'héroïsme de", actor, error);

      lines.push(`
        <li>
          <strong>${actor.name}</strong> :
          <span style="color: darkred;">erreur pendant la remise à zéro</span>
        </li>
      `);
    }
  }

  await FCoreChat.send(`
    <section class="hero-stats-report summary">
      <h3>⭐ Remise des points d'héroïsme</h3>
      <ul>${lines.join("")}</ul>
      <p>Modifications totales : <strong>${totalChanged}</strong></p>
    </section>
  `, {
    whisper: FCoreChat.getGMIds()
  });

  return totalChanged;
}

export function getHeroPointsUsedByActor(actorId) {
  return getHeroPointsLog()
    .filter(entry => entry.actorId === actorId && entry.type === "spend")
    .reduce((total, entry) => total + entry.amount, 0);
}

export function getHeroPointsGainedByActor(actorId) {
  return getHeroPointsLog()
    .filter(entry => entry.actorId === actorId && entry.type === "gain")
    .reduce((total, entry) => total + entry.amount, 0);
}

export function getTotalHeroPointsUsed() {
  return getHeroPointsLog()
    .filter(entry => entry.type === "spend")
    .reduce((total, entry) => total + entry.amount, 0);
}

export function getTotalHeroPointsGained() {
  return getHeroPointsLog()
    .filter(entry => entry.type === "gain")
    .reduce((total, entry) => total + entry.amount, 0);
}

export async function resetHeroPointsLog() {
  await setHeroPointLog(createDefaultHeroLog());
}