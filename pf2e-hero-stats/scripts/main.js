import { registerSettings, MODULE_ID } from "./settings.js";
import { setupChatListeners } from "./chat-listeners.js";

import {
  initHeroPoints,
  getHeroPointsLog,
  getTotalHeroPointsUsed,
  getTotalHeroPointsGained,
  giveOneHeroPointToParty,
  resetPartyHeroPoints,
  resetHeroPointsLog
} from "./hero-points.js";

import {
  initDiceStats,
  getDiceStats,
  resetDiceStats
} from "./dice-stats.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Ready`);

  setupChatListeners();
  initHeroPoints();
  initDiceStats();

  exposeApi();

  ui.notifications.info("PF2e/SF2e Hero Stats loaded.");
});

function exposeApi() {
  game.heroStats = {
    getStats: () => getDiceStats(),

    getHeroLog: () => getHeroPointsLog(),

    getHeroSummary: () => ({
      used: getTotalHeroPointsUsed(),
      gained: getTotalHeroPointsGained(),
      entries: getHeroPointsLog()
    }),

    giveOneHeroPointToParty: async () => {
      return giveOneHeroPointToParty();
    },

    resetDiceStats: async () => {
      await resetDiceStats();
      ui.notifications.info("Statistiques de dés réinitialisées.");
    },

    resetHeroPointsLog: async () => {
      await resetHeroPointsLog();
      ui.notifications.info("Journal des points d'héroïsme réinitialisé.");
    },

    resetAll: async () => {
      await resetDiceStats();
      await resetHeroPointsLog();
      ui.notifications.info("PF2e/SF2e Hero Stats : toutes les données ont été réinitialisées.");
    },

    resetPartyHeroPoints: async (value = 0) => {
      return resetPartyHeroPoints(value);
    }
  };

  console.log(`${MODULE_ID} | API exposed on game.heroStats`);
}