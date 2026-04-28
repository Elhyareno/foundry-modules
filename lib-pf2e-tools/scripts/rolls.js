export class PF2eRolls {
  static async roll(formula, label = "") {
    const roll = new Roll(formula);
    await roll.roll({ async: true });

    roll.toMessage({
      flavor: label
    });

    return roll;
  }
}