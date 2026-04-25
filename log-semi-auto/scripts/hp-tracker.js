import { combatLogs } from "./state.js";

export function trackHpChange(actor, changes) {
  const combat = game.combat;
  if (!combat || !combatLogs[combat.id]) return;

  const hpChange = foundry.utils.getProperty(changes, "system.attributes.hp.value");
  if (hpChange === undefined) return;

  const log = combatLogs[combat.id];
  const entry = log.combatants[actor.id];
  if (!entry) return;

  const oldHp = getHp(actor).value;
  const newHp = Number(hpChange);
  const delta = newHp - oldHp;

  entry.endHp = newHp;

  if (delta < 0) entry.damageTaken += Math.abs(delta);
  if (delta > 0) entry.healingReceived += delta;
  if (oldHp > 0 && newHp <= 0) entry.dropped = true;
}

function getHp(actor) {
  return {
    value: Number(foundry.utils.getProperty(actor, "system.attributes.hp.value") ?? 0),
    max: Number(foundry.utils.getProperty(actor, "system.attributes.hp.max") ?? 0)
  };
}
