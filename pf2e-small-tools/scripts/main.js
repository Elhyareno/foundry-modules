import { MODULE_ID } from "./constants.js";
import { openRepairDialog, handleRepairRoll } from "./repair.js";
import { openQuickTestDialog, handleQuickTestRoll } from "./quick-test.js";
import { registerSocket } from "./socket.js";
import { registerSmallToolsInMatCore } from "./integrations/matcore.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);

  globalThis.PF2eSmallTools = {
    openRepairDialog,
    openQuickTestDialog
  };
});

Hooks.once("ready", () => {
  game.pf2eSmallTools = {
    openRepairDialog: () => openRepairDialog(),
    openQuickTestDialog: () => openQuickTestDialog()
  };

  const tryRegisterMatCore = () => {
    if (game.matcore?.registerModule) {
      registerSmallToolsInMatCore();
      return true;
    }

    return false;
  };

  Hooks.once("matcoreReady", tryRegisterMatCore);

  if (!tryRegisterMatCore()) {
    setTimeout(tryRegisterMatCore, 250);
  }

  ui.notifications.info("PF2e Small Tools chargé.");
});

Hooks.on("renderChatMessage", (message, html) => {
  html.find(".pf2e-small-tools-repair-roll").on("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    await handleRepairRoll(event.currentTarget);
  });

  html.find(".pf2e-small-tools-quick-test-roll").on("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    await handleQuickTestRoll(event.currentTarget);
  });
});
