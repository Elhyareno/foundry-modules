export class PF2eActor {
  static getLevel(actor) {
    return Number(actor?.system?.details?.level?.value ?? 1);
  }

  static getHP(actor) {
    return actor?.system?.attributes?.hp ?? null;
  }

  static getMaxHP(actor) {
    return this.getHP(actor)?.max ?? 0;
  }

  static getCurrentHP(actor) {
    return this.getHP(actor)?.value ?? 0;
  }

  static async applyDamage(actor, amount) {
    const hp = this.getHP(actor);
    if (!hp) return null;

    const newValue = Math.max(Number(hp.value ?? 0) - Number(amount ?? 0), 0);

    return actor.update({
      "system.attributes.hp.value": newValue
    });
  }

  static async applyHealing(actor, amount) {
    const hp = this.getHP(actor);
    if (!hp) return null;

    const newValue = Math.min(
      Number(hp.value ?? 0) + Number(amount ?? 0),
      Number(hp.max ?? 0)
    );

    return actor.update({
      "system.attributes.hp.value": newValue
    });
  }

  static getClassSlug(actor) {
    const classItem = actor?.items?.find(item => item.type === "class");

    return String(
      actor?.class?.slug
        ?? classItem?.slug
        ?? classItem?.system?.slug
        ?? classItem?.name
        ?? ""
    ).toLowerCase();
  }

  static hasClass(actor, classSlug) {
    return this.getClassSlug(actor) === String(classSlug).toLowerCase();
  }

  static getSpellcastingDCRank(actor) {
    const candidates = [
      actor?.system?.proficiencies?.spellcasting?.rank,
      actor?.system?.attributes?.spellDC?.rank,
      actor?.system?.attributes?.spellcasting?.rank,
      actor?.system?.spellcasting?.rank,

      actor?.system?.proficiencies?.spellcasting,
      actor?.system?.attributes?.spellDC,
      actor?.system?.attributes?.spellcasting,
      actor?.system?.spellcasting
    ];

    for (const candidate of candidates) {
      const rank = this.extractProficiencyRank(candidate);

      if (rank !== null) {
        return rank;
      }
    }

    return 1;
  }

  static extractProficiencyRank(value) {
    if (value === null || value === undefined) return null;

    if (typeof value === "object") {
      const objectCandidates = [
        value.rank,
        value.proficiency?.rank,
        value.proficient?.rank,
        value.value
      ];

      for (const candidate of objectCandidates) {
        const rank = this.normalizeProficiencyRank(candidate);

        if (rank !== null) {
          return rank;
        }
      }

      return null;
    }

    return this.normalizeProficiencyRank(value);
  }

  static normalizeProficiencyRank(value) {
    if (value === null || value === undefined) return null;

    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      if (numericValue >= 0 && numericValue <= 4) {
        return numericValue;
      }

      return null;
    }

    const textValue = String(value)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const ranks = {
      untrained: 0,
      nonqualifie: 0,
      "non-qualifie": 0,

      trained: 1,
      qualifie: 1,

      expert: 2,

      master: 3,
      maitre: 3,

      legendary: 4,
      legendaire: 4
    };

    return ranks[textValue] ?? null;
  }
 
  static getXP(actor) {
    return Number(actor?.system?.details?.xp?.value ?? 0);
  }

  static getXPMax(actor) {
    return Number(actor?.system?.details?.xp?.max ?? 1000);
  }

  static async addXP(actor, amount) {
    const xp = Number(amount ?? 0);

    if (!actor || !Number.isFinite(xp) || xp <= 0) {
      return null;
    }

    const currentXP = this.getXP(actor);
    const newXP = currentXP + xp;

    return actor.update({
      "system.details.xp.value": newXP
    });
  }

  static getPlayerCharacters() {
    return game.actors.filter(actor => {
      if (actor.type !== "character") return false;

      return game.users.some(user => {
        if (user.isGM) return false;
        if (!user.character) return false;

        return user.character.id === actor.id;
      });
    });
  }

  static async addXPToParty(amount, reason = "Récompense d’exploration") {
    const xp = Number(amount ?? 0);

    if (!Number.isFinite(xp) || xp <= 0) {
      return [];
    }

    const actors = this.getPlayerCharacters();

    if (!actors.length) {
      ui.notifications.warn("Aucun personnage joueur trouvé pour recevoir l’XP.");
      return [];
    }

    const updated = [];

    for (const actor of actors) {
      await this.addXP(actor, xp);
      updated.push(actor);
    }

    return updated;
  }  
}