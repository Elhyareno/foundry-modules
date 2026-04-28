export class PF2eResources {
  static get(actor, path) {
    return foundry.utils.getProperty(actor, path);
  }

  static async set(actor, path, value) {
    return actor.update({
      [path]: value
    });
  }

  // Vitality Network (ton cas spécifique)
  static getVitality(actor) {
    return this.get(actor, "system.resources.vitalityNetwork");
  }

  static async setVitality(actor, value) {
    return this.set(actor, "system.resources.vitalityNetwork.value", value);
  }
}