export class PF2eSkills {
  static getModifier(actor, skillSlug) {
    return actor.system.skills?.[skillSlug]?.mod ?? 0;
  }

  static async roll(actor, skillSlug, options = {}) {
    const skill = actor.system.skills?.[skillSlug];

    if (!skill) {
      ui.notifications.warn(`Compétence inconnue : ${skillSlug}`);
      return;
    }

    return actor.rollSkill(skillSlug, options);
  }
}