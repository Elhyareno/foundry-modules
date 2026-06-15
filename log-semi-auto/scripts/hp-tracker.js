import { combatLogs, saveCombatLogs } from "./state.js";

export function trackHpChange(actor, changes) {
  if (!game.user.isGM) return;
  const combat = game.combat;
  if (!combat || !combatLogs[combat.id]) return;

  const hpChange = foundry.utils.getProperty(changes, "system.attributes.hp.value");
  if (hpChange === undefined) return;

  const log = combatLogs[combat.id];
  
  // KEY FIX: Trouver le combattant correspondant à cet actor dans le combat actuel
  const combatant = combat.combatants.find(c => c.actorId === actor.id);
  if (!combatant) return;

  const entry = log.combatants[combatant.id];
  if (!entry) return;

  const oldHp = getHp(actor).value;
  const newHp = Number(hpChange);
  const delta = newHp - oldHp;

  entry.endHp = newHp;

  if (delta < 0) entry.damageTaken += Math.abs(delta);
  if (delta > 0) entry.healingReceived += delta;
  if (oldHp > 0 && newHp <= 0) entry.dropped = true;

  saveCombatLogs().catch(err => {
    console.error("log-semi-auto | Impossible de sauvegarder les PV du combat", err);
  });
}

function getHp(actor) {
  return {
    value: Number(foundry.utils.getProperty(actor, "system.attributes.hp.value") ?? 0),
    max: Number(foundry.utils.getProperty(actor, "system.attributes.hp.max") ?? 0)
  };
}
