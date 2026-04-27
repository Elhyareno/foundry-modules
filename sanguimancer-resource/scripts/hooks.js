import { MODULE_ID, getTHP } from "./constants.js";
import { registerChatListeners } from "./chat.js";

export function registerHooks() {
  registerChatListeners();

  const thpCache = new Map();
  const actorLock = new Set();

  Hooks.on("updateActor", async (actor, changed) => {
    if (!actor?.isOwner) return;
    if (!game.sanguimancer?.hasDedication(actor)) return;
    if (actorLock.has(actor.id)) return;

    const hpChanged = foundry.utils.hasProperty(changed, "system.attributes.hp.temp");
    if (!hpChanged) return;

    const currentTHP = getTHP(actor);
    const lastTHP = thpCache.get(actor.id);

    if (lastTHP !== undefined && currentTHP < lastTHP) {
      actorLock.add(actor.id);

      try {
        await game.sanguimancer.reconcileAfterDamage(actor);
      } catch (err) {
        console.error(`${MODULE_ID} | reconcileAfterDamage error`, err);
      } finally {
        actorLock.delete(actor.id);
      }
    }

    thpCache.set(actor.id, currentTHP);
  });

  Hooks.on("renderActorSheet", (app, html) => {
    const actor = app.actor ?? app.document;

    if (!actor) return;
    if (!game.sanguimancer?.hasDedication(actor)) return;

    const restButton = html.find?.('[data-action="rest-for-the-night"], [data-action="rest"]');
    if (!restButton?.length) return;

    restButton.off(".sanguimancer");

    restButton.on("click.sanguimancer", () => {
      setTimeout(async () => {
        try {
          await game.sanguimancer.onFullRest(actor);
        } catch (err) {
          console.error(`${MODULE_ID} | onFullRest error`, err);
        }
      }, 100);
    });
  });

  Hooks.on("updateCombat", async (combat, changed) => {
    if (!game.combat) return;
    if (!("round" in changed) && !("turn" in changed)) return;

    const actorsInCombat = combat.combatants
      .map((combatant) => combatant.actor)
      .filter((actor) => !!actor);

    for (const actor of actorsInCombat) {
      if (!game.sanguimancer?.hasDedication(actor)) continue;

      try {
        await game.sanguimancer.cleanupExpiredTemporaryResources(actor);
      } catch (err) {
        console.error(`${MODULE_ID} | cleanupExpiredTemporaryResources error`, err);
      }
    }

    const activeActor = combat.combatant?.actor;

    if (activeActor) {
      try {
        await game.sanguimancer.applyTransfusionHealing(activeActor, combat);
      } catch (err) {
        console.error(`${MODULE_ID} | applyTransfusionHealing error`, err);
      }
    }
  });
}