export class PF2eCombat {
  static getCurrentActor() {
    return game.combat?.combatant?.actor ?? null;
  }

  static onTurnStart(callback) {
    Hooks.on("pf2e.startTurn", callback);
  }

  static onCombatStart(callback) {
    Hooks.on("combatStart", callback);
  }
}