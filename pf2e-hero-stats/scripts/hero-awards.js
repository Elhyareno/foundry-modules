import { FCoreChat, FCoreUI } from "../../lib-foundry-core/scripts/index.js";
import { getSetting, setSetting } from "./settings.js";
import { addHeroPoint } from "./hero-points.js";

const MODULE_ID = "pf2e-hero-stats";

export function initHeroAwards() {
  Hooks.on("createChatMessage", handleChatMessage);
}

export function setupAwardButtonListeners() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    html.querySelectorAll("[data-action='award-hero-award']").forEach(btn => {
      btn.addEventListener("click", async () => {
        const actorId = btn.dataset.actorId;
        const actor = game.actors.get(actorId);

        if (!actor) {
          FCoreUI.warn("Acteur introuvable.");
          return;
        }

        await addHeroPoint(actor, 1, "Décision du MJ");

        FCoreUI.info(`${actor.name} reçoit un point d'héroïsme.`);
        btn.disabled = true;
      });
    });
  });
}

async function handleChatMessage(message) {
  if (!game.user.isGM) return;

  const roll = message.rolls?.[0];
  if (!roll) return;

  const die = roll.dice?.[0];
  if (!die) return;

  const result = die.results?.[0]?.result;
  if (!result) return;

  const actor = game.actors.get(message.speaker.actor);
  if (!actor) return;

  // 🎯 20 naturel
  if (result === 20 && getSetting("awardModeNatural20") !== "off") {
    if (getSetting("awardModeNatural20") === "auto") {
      await addHeroPoint(actor, 1, "20 naturel");

      await FCoreChat.send(`
        <div class="hero-stats-report">
          <h3>✨ Coup du destin</h3>
          <p><strong>${actor.name}</strong> obtient un point d'héroïsme (20 naturel).</p>
        </div>
      `);
    }

    if (getSetting("awardModeNatural20") === "suggest") {
      await FCoreChat.send(`
        <div class="hero-stats-report">
          <h3>✨ 20 naturel détecté</h3>
          <p><strong>${actor.name}</strong> a fait un 20 naturel.</p>
          <button data-action="award-hero-point" data-actor-id="${actor.id}">
            Donner 1 point d'héroïsme
          </button>
        </div>
      `, {
        whisper: FCoreChat.getGMIds()
      });
    }
  }
}

export async function resetAwardData() {
  await setSetting("awardData", {
    version: 1,
    combat: {
      encounterId: null,
      awardedNatural20: {},
      suggestedBadLuck: {}
    }
  });
}

export async function evaluateHeroAwards({
  actor,
  actorStats,
  message,
  roll,
  rollType,
  naturalD20,
  outcome
}) {
  if (!game.user.isGM) return;
  if (!actor || actor.type !== "character") return;

  if (getSetting("awardIgnoreFlatChecks") && rollType === "flat") {
    return;
  }

  if (naturalD20 === 20) {
    await handleNatural20Award(actor, message);
  }

  if (getSetting("suggestBadLuck")) {
    await handleBadLuckSuggestion(actor, actorStats);
  }
}

async function handleNatural20Award(actor, message) {
  const mode = getSetting("awardModeNatural20");

  if (mode === "off") return;

  const data = getSetting("awardData");

  const encounterId = game.combat?.id ?? null;
  const actorId = actor.id;

  if (getSetting("awardNatural20OncePerCombat") && encounterId) {
    const alreadyAwarded = data.combat?.awardedNatural20?.[actorId];

    if (alreadyAwarded === encounterId) {
      return;
    }
  }

  if (mode === "auto") {
    await addHeroPoint(actor, 1, "20 naturel");

    data.combat.awardedNatural20[actorId] = encounterId;
    await setSetting("awardData", data);

    await FCoreChat.send(`
      <section class="hero-stats-report summary">
        <h3>⭐ 20 naturel</h3>
        <p><strong>${actor.name}</strong> gagne 1 point d'héroïsme.</p>
      </section>
    `);

    return;
  }

  if (mode === "suggest") {
    await FCoreChat.send(`
      <section class="hero-stats-report summary">
        <h3>⭐ 20 naturel détecté</h3>
        <p><strong>${actor.name}</strong> a obtenu un 20 naturel.</p>
        <button
          type="button"
          data-action="hero-stats-award"
          data-actor-id="${actor.id}"
          data-reason="20 naturel"
        >
          Donner 1 point d'héroïsme
        </button>
      </section>
    `, {
      whisper: FCoreChat.getGMIds()
    });
  }
}

async function handleBadLuckSuggestion(actor, actorStats) {
  const threshold = Number(getSetting("badLuckFailureStreak") ?? 3);
  const streak = Number(actorStats?.streak?.failures ?? 0);

  if (streak < threshold) return;

  const data = getSetting("awardData");
  const encounterId = game.combat?.id ?? null;
  const actorId = actor.id;

  if (getSetting("badLuckOncePerCombat") && encounterId) {
    const alreadySuggested = data.combat?.suggestedBadLuck?.[actorId];

    if (alreadySuggested === encounterId) {
      return;
    }
  }

  data.combat.suggestedBadLuck[actorId] = encounterId;
  await setSetting("awardData", data);

  await FCoreChat.send(`
    <section class="hero-stats-report summary">
      <h3>🌧️ Série de malchance</h3>
      <p>
        <strong>${actor.name}</strong> enchaîne ${streak} échecs.
        Le destin tousse dans sa manche.
      </p>
      <button
        type="button"
        data-action="hero-stats-award"
        data-actor-id="${actor.id}"
        data-reason="Série de malchance"
      >
        Donner 1 point d'héroïsme
      </button>
    </section>
  `, {
    whisper: FCoreChat.getGMIds()
  });
}