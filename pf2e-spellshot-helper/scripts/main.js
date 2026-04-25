import { MODULE_ID } from "./constants.js";
import { registerSpellshotHooks } from "./spellshot-manager.js";
import { useRecallAmmunition } from "./features/recall-ammunition.js";
import { useThoughtfulReload } from "./features/thoughtful-reload.js";
import { useDispellingBullet } from "./features/dispelling-bullet.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
  registerSpellshotHooks();

  game.pfsh = {
    recallAmmunition: useRecallAmmunition,
    thoughtfulReload: useThoughtfulReload,
    dispellingBullet: useDispellingBullet
  };
});