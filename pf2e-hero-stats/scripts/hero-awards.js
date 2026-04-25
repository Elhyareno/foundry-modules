import {
  createDefaultAwardData,
  getSetting,
  setSetting
} from "./settings.js";

import {
  addHeroPoint,
  getHeroPoints,
  getMaxHeroPoints
} from "./hero-points.js";

import {
  duplicateData,
  isPrivateMessage
} from "./utils.js";

/* =========================
   Initialisation
========================= */

export function initHeroAwards() {
  const data = getAwardData();

  if (!data || !data.combat) {
    setAwardData(createDefaultAwardData());
  }

  Hooks.on("combatStart", async (combat) => {
    await resetCombatAwardData(combat?.id ?? null);
  });

  Hooks.on("deleteCombat", async () => {
    await resetCombatAwardData(null);
  });
}

/* =========================
   Données
========================= */

export function getAwardData() {
  return getSetting("awardData") ?? createDefaultAwardData();
}

export async function setAwardData(data) {
  return setSetting("awardData", data);
}

async function resetCombatAwardData(encounterId = null) {
  const data = createDefaultAwardData();
  data.combat.encounterId = encounterId;
  await setAwardData(data);
}

/* =========================
   Entrée principale
========================= */

export async function evaluateHeroAwards({ actor, actorStats, message, roll, rollType, naturalD20, outcome }) {
  if (!actor || actor.type !== "character") return;

  if (isPrivateMessage(message)) return;

  if (getSetting("awardIgnoreFlatChecks") && rollType === "flat") {
    return;
  }

  await evaluateNatural20Award({ actor, message, rollType, naturalD20 });
  await evaluateBadLuckAward({ actor, actorStats, message, outcome });
}

/* =========================
   20 naturel
========================= */

async function evaluateNatural20Award({ actor, message, rollType, naturalD20 }) {
  if (naturalD20 !== 20) return;

  const mode = getSetting("awardModeNatural20");
  if (mode === "off") return;

  if (getSetting("awardNatural20OncePerCombat") && hasNatural20AwardThisCombat(actor.id)) {
    return;
  }

  if (getHeroPoints(actor) >= getMaxHeroPoints(actor)) {
    return;
  }

  if (mode === "auto") {
    const given = await addHeroPoint(actor, 1, "20 naturel");
    if (given > 0) {
      await markNatural20Award(actor.id);
      await whisperAwardResult(actor, `20 naturel sur un jet de type <strong>${rollType}</strong>. Point ajouté automatiquement.`);
    }
    return;
  }

  if (mode === "suggest") {
    await whisperNatural20Suggestion(actor, message, rollType);
  }
}

async function whisperNatural20Suggestion(actor, message, rollType) {
  await ChatMessage.create({
    content: `
      <section class="hero-stats-report summary" data-hero-award="natural20" data-actor-id="${actor.id}">
        <h3>⭐ Proposition d'héroïsme</h3>
        <p><strong>${actor.name}</strong> vient d'obtenir un <strong>20 naturel</strong>.</p>
        <p>Type de jet : <strong>${rollType}</strong></p>
        <p>Accorder 1 point d'héroïsme ?</p>
        <p>
          <button type="button" data-hero-award-action="grant" data-actor-id="${actor.id}" data-reason="20 naturel">Accorder</button>
          <button type="button" data-hero-award-action="ignore">Ignorer</button>
        </p>
      </section>
    `,
    speaker: message?.speaker ?? ChatMessage.getSpeaker(),
    whisper: ChatMessage.getWhisperRecipients("GM")
  });
}

/* =========================
   Malchance
========================= */

async function evaluateBadLuckAward({ actor, actorStats, message, outcome }) {
  if (!getSetting("suggestBadLuck")) return;
  if (!outcome) return;

  const isFailure = outcome === "failure" || outcome === "criticalFailure";
  if (!isFailure) return;

  const threshold = Number(getSetting("badLuckFailureStreak") ?? 3);
  const streak = actorStats?.streak?.failures ?? 0;

  if (streak < threshold) return;

  if (getSetting("badLuckOncePerCombat") && hasBadLuckSuggestionThisCombat(actor.id)) {
    return;
  }

  if (getHeroPoints(actor) >= getMaxHeroPoints(actor)) {
    return;
  }

  await markBadLuckSuggestion(actor.id);

  await ChatMessage.create({
    content: `
      <section class="hero-stats-report summary" data-hero-award="badLuck" data-actor-id="${actor.id}">
        <h3>🌧️ Proposition d'héroïsme</h3>
        <p><strong>${actor.name}</strong> vient d'enchaîner <strong>${streak}</strong> échecs.</p>
        <p>Accorder 1 point d'héroïsme pour compenser la morsure du destin ?</p>
        <p>
          <button type="button" data-hero-award-action="grant" data-actor-id="${actor.id}" data-reason="Série de malchance">Accorder</button>
          <button type="button" data-hero-award-action="ignore">Ignorer</button>
        </p>
      </section>
    `,
    speaker: message?.speaker ?? ChatMessage.getSpeaker(),
    whisper: ChatMessage.getWhisperRecipients("GM")
  });
}

/* =========================
   Mémoire combat
========================= */

function getCombatKey() {
  return game.combat?.id ?? "no-combat";
}

function hasNatural20AwardThisCombat(actorId) {
  const data = getAwardData();
  const key = getCombatKey();
  return Boolean(data.combat.awardedNatural20?.[key]?.[actorId]);
}

async function markNatural20Award(actorId) {
  const data = duplicateData(getAwardData());
  const key = getCombatKey();

  data.combat.awardedNatural20[key] ??= {};
  data.combat.awardedNatural20[key][actorId] = true;

  await setAwardData(data);
}

function hasBadLuckSuggestionThisCombat(actorId) {
  const data = getAwardData();
  const key = getCombatKey();
  return Boolean(data.combat.suggestedBadLuck?.[key]?.[actorId]);
}

async function markBadLuckSuggestion(actorId) {
  const data = duplicateData(getAwardData());
  const key = getCombatKey();

  data.combat.suggestedBadLuck[key] ??= {};
  data.combat.suggestedBadLuck[key][actorId] = true;

  await setAwardData(data);
}

/* =========================
   Boutons chat
========================= */

export function setupAwardButtonListeners() {
  Hooks.on("renderChatMessageHTML", (_message, html) => {
    bindAwardButtons(html);
  });

  Hooks.on("renderChatMessage", (_message, html) => {
    bindAwardButtons(html);
  });
}

function bindAwardButtons(html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;

  const buttons = root.querySelectorAll?.("[data-hero-award-action]");
  if (!buttons?.length) return;

  for (const button of buttons) {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      const action = button.dataset.heroAwardAction;

      if (action === "ignore") {
        const section = button.closest("[data-hero-award]");
        if (section) section.innerHTML += `<p><em>Proposition ignorée.</em></p>`;
        button.disabled = true;
        return;
      }

      if (action !== "grant") return;

      const actorId = button.dataset.actorId;
      const reason = button.dataset.reason ?? "Gain accordé par le MJ";
      const actor = game.actors.get(actorId);

      if (!actor) {
        ui.notifications.error("Acteur introuvable pour l'attribution du point d'héroïsme.");
        return;
      }

      const given = await addHeroPoint(actor, 1, reason);

      if (given > 0) {
        await markNatural20Award(actor.id);
        await whisperAwardResult(actor, `${reason} : 1 point d'héroïsme accordé.`);
        button.disabled = true;
        button.textContent = "Accordé";
      } else {
        ui.notifications.warn(`${actor.name} est déjà au maximum de points d'héroïsme.`);
      }
    });
  }
}

async function whisperAwardResult(actor, text) {
  await ChatMessage.create({
    content: `
      <section class="hero-stats-report summary">
        <h3>⭐ Héroïsme accordé</h3>
        <p><strong>${actor.name}</strong> : ${text}</p>
      </section>
    `,
    whisper: ChatMessage.getWhisperRecipients("GM")
  });
}

/* =========================
   Reset public API
========================= */

export async function resetAwardData() {
  await setAwardData(createDefaultAwardData());
}