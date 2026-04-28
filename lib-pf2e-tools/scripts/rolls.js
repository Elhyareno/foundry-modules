export class PF2eRolls {
  static async roll(formula, label = "") {
    const roll = new Roll(formula);
    await roll.roll({ async: true });

    roll.toMessage({
      flavor: label
    });

    return roll;
  }

  static getDegreeOfSuccess(d20, total, dc) {
    let degree = total >= dc + 10
      ? "criticalSuccess"
      : total >= dc
        ? "success"
        : total <= dc - 10
          ? "criticalFailure"
          : "failure";

    if (d20 === 20) degree = this.improveDegree(degree);
    if (d20 === 1) degree = this.worsenDegree(degree);

    return degree;
  }

  static improveDegree(degree) {
    const order = ["criticalFailure", "failure", "success", "criticalSuccess"];
    return order[Math.min(order.indexOf(degree) + 1, 3)];
  }

  static worsenDegree(degree) {
    const order = ["criticalFailure", "failure", "success", "criticalSuccess"];
    return order[Math.max(order.indexOf(degree) - 1, 0)];
  }

  static getDegreeLabel(degree) {
    return {
      criticalSuccess: "Réussite critique",
      success: "Réussite",
      failure: "Échec",
      criticalFailure: "Échec critique"
    }[degree] ?? degree;
  }
}