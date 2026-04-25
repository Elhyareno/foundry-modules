import { MODULE_ID } from "./constants.js";
import { renderVitalityWidget } from "./sheet.js";
import { handleCombatUpdate } from "./combat.js";
import { registerRestHook } from "./rest.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);
});

Hooks.once("ready", () => {
  registerRestHook();
});

Hooks.on("renderActorSheet", async (app, html) => {
  await renderVitalityWidget(app, html);
});

Hooks.on("updateCombat", async (combat, changed, options, userId) => {
  await handleCombatUpdate(combat, changed, options, userId);
});