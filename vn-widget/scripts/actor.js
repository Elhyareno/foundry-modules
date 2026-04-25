/**
 * Get the level of an actor
 * @param {Actor} actor - The actor to get the level from
 * @returns {number} The actor's level
 */
export function getActorLevel(actor) {
  return Number(actor.system?.details?.level?.value ?? 1);
}

/**
 * Get the HP object of an actor
 * @param {Actor} actor - The actor to get HP from
 * @returns {object} The HP object with value and max properties
 */
export function getHP(actor) {
  return actor.system.attributes.hp;
}
