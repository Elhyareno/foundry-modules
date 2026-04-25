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
 * PF2e/SF2e data structures may vary slightly depending on version/fork,
 * so this tries several common paths.
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
    actor.system?.proficiencies?.spellcasting?.value,
    actor.system?.attributes?.spellDC?.rank,
    actor.system?.attributes?.spellDC?.value,
    actor.system?.attributes?.spellcasting?.rank,
    actor.system?.attributes?.spellcasting?.value,
    actor.system?.spellcasting?.rank,
    actor.system?.spellcasting?.value
  ];

  for (const candidate of candidates) {
    const rank = normalizeProficiencyRank(candidate);

    if (rank !== null) {
      return rank;
    }
  }

  return 1;
}

function normalizeProficiencyRank(value) {
  if (value === null || value === undefined) return null;

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return numericValue;
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