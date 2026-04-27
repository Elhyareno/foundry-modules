import { MODULE_ID } from "./constants.js";

export function registerHooks() {
  const thpCache = new Map();
  const actorLock = new Set();

  // =========================
  // Détection dégâts
  // =========================
  Hooks.on("updateActor", async (actor) => {
    if (!actor?.isOwner) return;
    if (!game.sanguimancer?.hasDedication(actor)) return;
    if (actorLock.has(actor.id)) return;

    const currentTHP = actor.system?.attributes?.hp?.temp ?? 0;
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

  // =========================
  // Bouton repos
  // =========================
  Hooks.on("renderActorSheet", (app, html) => {
    const actor = app.actor ?? app.document;
    if (!actor) return;
    if (!game.sanguimancer?.hasDedication(actor)) return;

    const restButton = html.find('[data-action="rest-for-the-night"], [data-action="rest"]');
    if (!restButton.length) return;

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

  // =========================
  // Nettoyage ressources temporaires
  // =========================
  Hooks.on("updateCombat", async (combat, changed) => {
  if (!game.combat) return;
  if (!("round" in changed) && !("turn" in changed)) return;

  const actorsInCombat = combat.combatants
    .map((c) => c.actor)
    .filter((a) => !!a);

  // Nettoyage des ressources temporaires sanguimanciennes
  for (const actor of actorsInCombat) {
    if (!game.sanguimancer?.hasDedication(actor)) continue;

    try {
      await game.sanguimancer.cleanupExpiredTemporaryResources(actor);
    } catch (err) {
      console.error(`${MODULE_ID} | cleanupExpiredTemporaryResources error`, err);
    }
  }

  // Application du Fast Healing de Transfusion au début du tour
  const activeActor = combat.combatant?.actor;
  if (activeActor) {
    try {
      await game.sanguimancer.applyTransfusionHealing(activeActor);
    } catch (err) {
      console.error(`${MODULE_ID} | applyTransfusionHealing error`, err);
    }
  }
});
}