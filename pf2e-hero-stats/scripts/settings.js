const MODULE_ID = "pf2e-hero-stats";

export function registerSettings() {
  game.settings.register(MODULE_ID, "trackDiceStats", {
    name: "Track Dice Statistics",
    hint: "Enable tracking of dice rolls for statistics.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "trackHeroPoints", {
    name: "Track Hero Points",
    hint: "Enable automatic tracking of hero points used.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "generateReports", {
    name: "Generate Combat Reports",
    hint: "Automatically generate and save combat reports.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "reportFormat", {
    name: "Report Format",
    hint: "Choose the format for combat reports.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      detailed: "Detailed Report",
      summary: "Summary Report",
      minimal: "Minimal Report"
    },
    default: "detailed"
  });
}

export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}
