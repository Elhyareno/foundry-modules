import { registerSettings } from "./settings.js";
import { setupChatListeners } from "./chat-listeners.js";
import { initHeroPoints } from "./hero-points.js";
import { initDiceStats } from "./dice-stats.js";

const MODULE_ID = "pf2e-hero-stats";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Ready`);
  setupChatListeners();
  initHeroPoints();
  initDiceStats();
  
  ui.notifications.info("PF2e Hero Stats loaded.");
});
