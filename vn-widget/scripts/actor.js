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
    const value = Number(candidate);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return 1;
}