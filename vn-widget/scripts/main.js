import { MODULE_ID } from "./constants.js";
import { renderVitalityWidget } from "./sheet.js";
import { handleCombatRound } from "./combat.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);
});

Hooks.on("renderActorSheet", async (app, html) => {
  await renderVitalityWidget(app, html);
});

Hooks.on("combatRound", async (combat, data) => {
  await handleCombatRound(combat, data);
});
