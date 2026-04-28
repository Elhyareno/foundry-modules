export class PF2eSystem {
  static isPF2e() {
    return game.system.id === "pf2e";
  }

  static isSF2e() {
    return game.system.id === "sf2e";
  }

  static isSupported() {
    return ["pf2e", "sf2e"].includes(game.system.id);
  }
}