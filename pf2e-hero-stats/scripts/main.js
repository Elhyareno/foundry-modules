import { FCoreUI } from "../../lib-foundry-core/scripts/index.js";
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
  initHeroAwards,
  setupAwardButtonListeners,
  resetAwardData
} from "./hero-awards.js";

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
  initHeroAwards();
  initDiceStats();
  setupAwardButtonListeners();

  exposeApi();

  FCoreUI.info("PF2e/SF2e Hero Stats loaded.");
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

    resetPartyHeroPoints: async (value = 0) => {
      return resetPartyHeroPoints(value);
    },

    resetDiceStats: async () => {
      await resetDiceStats();
      FCoreUI.info("Statistiques de dés réinitialisées.");
    },

    resetHeroPointsLog: async () => {
      await resetHeroPointsLog();
      FCoreUI.info("Journal des points d'héroïsme réinitialisé.");
    },

    resetAwardData: async () => {
      await resetAwardData();
      FCoreUI.info("Mémoire des propositions d'héroïsme réinitialisée.");
    },

    resetAll: async () => {
      await resetDiceStats();
      await resetHeroPointsLog();
      await resetAwardData();
      FCoreUI.info("PF2e/SF2e Hero Stats : toutes les données ont été réinitialisées.");
    }
  };

  console.log(`${MODULE_ID} | API exposed on game.heroStats`);
}

Hooks.once("ready", () => {
  game.heroStats = {
    getStats: () => {
      return game.heroStatsData ?? {};
    },

    getHeroSummary: () => {
      return game.heroHeroPoints ?? {};
    },

    open: () => {
      ui.notifications.info("Hero Stats panel à venir");
    }
  };

  console.log("pf2e-hero-stats | API exposée sur game.heroStats");
});