export const MODULE_ID = "pf2e-hero-stats";

/* =========================
   Structures par défaut
========================= */

export function createDefaultStatsData() {
  return {
    version: 1,
    startedAt: new Date().toISOString(),

    actors: {},

    totals: {
      rolls: 0,
      natural1: 0,
      natural20: 0,
      criticalSuccesses: 0,
      successes: 0,
      failures: 0,
      criticalFailures: 0
    }
  };
}

export function createDefaultHeroLog() {
  return {
    version: 1,
    entries: []
  };
}

/* =========================
   Enregistrement settings
========================= */

export function registerSettings() {

  // 🔴 DONNÉES PERSISTANTES
  game.settings.register(MODULE_ID, "statsData", {
    scope: "world",
    config: false,
    type: Object,
    default: createDefaultStatsData()
  });

  game.settings.register(MODULE_ID, "heroPointLog", {
    scope: "world",
    config: false,
    type: Object,
    default: createDefaultHeroLog()
  });

  // 🟢 OPTIONS UTILISATEUR
  game.settings.register(MODULE_ID, "trackDiceStats", {
    name: "Suivre les statistiques de dés",
    hint: "Enregistre les jets d20 dans les statistiques.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "trackHeroPoints", {
    name: "Suivre les points d'héroïsme",
    hint: "Détecte automatiquement les gains et dépenses.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "trackOnlyPlayerCharacters", {
    name: "Limiter aux PJ",
    hint: "Ignore les PNJ.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "ignorePrivateRolls", {
    name: "Ignorer jets privés",
    hint: "Ignore les jets murmurés.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "ignoreFlatChecks", {
    name: "Ignorer jets plats",
    hint: "Ignore les flat checks.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "reportFormat", {
    name: "Format du rapport",
    scope: "world",
    config: true,
    type: String,
    choices: {
      detailed: "Détaillé",
      summary: "Résumé",
      minimal: "Minimal"
    },
    default: "detailed"
  });
}

/* =========================
   Helpers
========================= */

export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

export async function setSetting(key, value) {
  return game.settings.set(MODULE_ID, key, value);
}