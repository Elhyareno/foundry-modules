export function getActorLevel(actor) {
  return Number(actor.system?.details?.level?.value ?? 1);
}


export function getHP(actor) {
  return actor.system.attributes.hp;
}


export function isVitalityActor(actor) {
  if (!actor) return false;
  if (actor.type !== "character") return false;

  const classItem = actor.items?.find((item) => item.type === "class");

  const classSlug = String(
    actor.class?.slug
      ?? classItem?.slug
      ?? classItem?.system?.slug
      ?? classItem?.name
      ?? ""
  ).toLowerCase();

  return classSlug === "mystic";
}


/**
 * Get the actor's spellcasting DC proficiency rank.
 *
 * Expected rank values:
 * 0 = untrained
 * 1 = trained
 * 2 = expert
 * 3 = master
 * 4 = legendary
 *
 * @param {Actor} actor - The actor to inspect
 * @returns {number}
 */
export function getSpellcastingDCRank(actor) {
  const candidates = [
    actor.system?.proficiencies?.spellcasting?.rank,
    actor.system?.attributes?.spellDC?.rank,
    actor.system?.attributes?.spellcasting?.rank,
    actor.system?.spellcasting?.rank,

    actor.system?.proficiencies?.spellcasting,
    actor.system?.attributes?.spellDC,
    actor.system?.attributes?.spellcasting,
    actor.system?.spellcasting
  ];

  for (const candidate of candidates) {
    const rank = extractProficiencyRank(candidate);

    if (rank !== null) {
      return rank;
    }
  }

  return 1;
}


function extractProficiencyRank(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === "object") {
    const objectCandidates = [
      value.rank,
      value.proficiency?.rank,
      value.proficient?.rank,
      value.value
    ];

    for (const candidate of objectCandidates) {
      const rank = normalizeProficiencyRank(candidate);

      if (rank !== null) {
        return rank;
      }
    }

    return null;
  }

  return normalizeProficiencyRank(value);
}


function normalizeProficiencyRank(value) {
  if (value === null || value === undefined) return null;

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    // Les rangs de maîtrise PF2e/SF2e vont normalement de 0 à 4.
    // Une valeur supérieure ressemble plutôt à un DD total, pas à un rang.
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