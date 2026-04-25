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

export function createDefaultAwardData() {
  return {
    version: 1,
    combat: {
      encounterId: null,
      awardedNatural20: {},
      suggestedBadLuck: {}
    }
  };
}

/* =========================
   Enregistrement settings
========================= */

export function registerSettings() {
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

  game.settings.register(MODULE_ID, "awardData", {
    scope: "world",
    config: false,
    type: Object,
    default: createDefaultAwardData()
  });

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

  game.settings.register(MODULE_ID, "awardModeNatural20", {
    name: "20 naturel",
    hint: "Détermine comment le module réagit à un 20 naturel.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      off: "Désactivé",
      suggest: "Proposer au MJ",
      auto: "Ajouter automatiquement"
    },
    default: "auto"
  });

  game.settings.register(MODULE_ID, "awardNatural20OncePerCombat", {
    name: "Limiter le 20 naturel à 1 fois par combat",
    hint: "Empêche un même personnage de recevoir plusieurs points automatiques pour 20 naturel dans le même combat.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "awardIgnoreFlatChecks", {
    name: "Ignorer les jets plats pour l'héroïsme",
    hint: "Les jets plats ne déclenchent pas de proposition ou gain d'héroïsme.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "suggestBadLuck", {
    name: "Proposer sur série de malchance",
    hint: "Propose au MJ d'accorder 1 point après plusieurs échecs consécutifs.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "badLuckFailureStreak", {
    name: "Seuil de malchance",
    hint: "Nombre d'échecs consécutifs avant proposition.",
    scope: "world",
    config: true,
    type: Number,
    default: 3
  });

  game.settings.register(MODULE_ID, "badLuckOncePerCombat", {
    name: "Limiter la malchance à 1 proposition par combat",
    hint: "Évite de proposer plusieurs fois pour le même personnage dans le même combat.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
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