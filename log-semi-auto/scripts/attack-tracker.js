import { combatLogs, saveCombatLogs } from "./state.js";

export function trackNotableAttack(message) {
  const combat = game.combat;
  if (!combat || !combatLogs[combat.id]) return;

  const log = combatLogs[combat.id];

  const flags = message.flags?.pf2e;
  const context = flags?.context;

  if (!context) return;

  const isCritical =
    context.outcome === "criticalSuccess" ||
    context.degreeOfSuccess === 3 ||
    message.content?.toLowerCase().includes("critical");

  if (!isCritical) return;

  const damage = getDamageFromMessage(message);
  if (!damage || damage <= 0) return;

  const actor = message.speaker?.actor ? game.actors.get(message.speaker.actor) : null;
  if (!actor) return;

  const combatantEntry = log.combatants[actor.id];

  const attack = {
    attacker: actor.name,
    damage,
    flavor: message.flavor ?? "",
    content: message.content ?? ""
  };

  const side = combatantEntry?.alliance === "enemy" ? "enemyCrit" : "playerCrit";
  const current = log.notableAttacks[side];

  if (!current || damage > current.damage) {
    log.notableAttacks[side] = attack;

    saveCombatLogs().catch(err => {
      console.error("log-semi-auto | Impossible de sauvegarder l’attaque notable", err);
    });
  }
}

export function getDamageFromMessage(message) {
  const rolls = message.rolls ?? [];
  let total = 0;

  for (const roll of rolls) {
    if (typeof roll.total === "number") total += roll.total;
  }

  return total;
}
