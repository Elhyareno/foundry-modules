import { handleEnergyShotDamage, initializeEnergyShotForCombat, resetEnergyShotOutsideCombat } from "./features/energy-shot.js";
import { trackMissedShot } from "./features/recall-ammunition.js";
import { debug, hasSpellshot } from "./utils.js";

export function registerSpellshotHooks() {
  Hooks.on("updateCombat", async (combat, changed) => {
    try {
      if (changed.started === true) {
        await initializeEnergyShotForCombat(combat);
      }
    } catch (err) {
      console.error("Spellshot Helper | updateCombat", err);
    }
  });

  Hooks.on("deleteCombat", async (combat) => {
    try {
      const actors = combat.combatants
        .map((c) => c.actor)
        .filter((a) => !!a && hasSpellshot(a));

      await resetEnergyShotOutsideCombat(actors);
    } catch (err) {
      console.error("Spellshot Helper | deleteCombat", err);
    }
  });

  Hooks.on("createChatMessage", async (message) => {
    try {
      await trackMissedShot(message);
      await handleEnergyShotDamage(message);
    } catch (err) {
      console.error("Spellshot Helper | createChatMessage", err);
    }
  });

  debug("Hooks enregistrés.");
}