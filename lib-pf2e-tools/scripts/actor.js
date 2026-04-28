export class PF2eActor {
  static getLevel(actor) {
    return actor.system.details?.level?.value ?? 0;
  }

  static getHP(actor) {
    return actor.system.attributes.hp;
  }

  static getMaxHP(actor) {
    return this.getHP(actor).max;
  }

  static getCurrentHP(actor) {
    return this.getHP(actor).value;
  }

  static async applyDamage(actor, amount) {
    const hp = this.getHP(actor);
    const newValue = Math.max(hp.value - amount, 0);

    return actor.update({
      "system.attributes.hp.value": newValue
    });
  }

  static async applyHealing(actor, amount) {
    const hp = this.getHP(actor);
    const newValue = Math.min(hp.value + amount, hp.max);

    return actor.update({
      "system.attributes.hp.value": newValue
    });
  }
}