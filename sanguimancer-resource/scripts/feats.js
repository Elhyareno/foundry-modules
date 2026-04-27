/**
 * Check if actor has Sanguimancer dedication
 */
export function hasDedication(actor) {
  return actor.itemTypes?.feat?.some(f => {
    const slug = (f.slug ?? f.system?.slug ?? "").toLowerCase();
    const name = (f.name ?? "").toLowerCase();
    return slug.includes("sanguimancer") || name.includes("sanguimancien");
  });
}

/**
 * Check if actor has a feat with given terms
 */
export function hasFeat(actor, terms = []) {
  return actor.itemTypes?.feat?.some(f => {
    const slug = (f.slug ?? f.system?.slug ?? "").toLowerCase();
    const name = (f.name ?? "").toLowerCase();
    return terms.some(t => slug.includes(t) || name.includes(t));
  });
}

/**
 * Check if actor has Blood Shield feat
 */
export const hasBloodShield = a => hasFeat(a, ["blood shield"]);

/**
 * Check if actor has Exsanguinate feat
 */
export const hasExsanguinate = a => hasFeat(a, ["exsanguinate"]);

/**
 * Check if actor has Transfusion feat
 */
export const hasTransfusion = a => hasFeat(a, ["transfusion"]);

/**
 * Check if actor has Venipuncture feat
 */
export const hasVenipuncture = a => hasFeat(a, ["venipuncture"]);

/**
 * Assert that actor is a sanguimancer with optional feat check
 */
export function assertSanguimancerFeat(actor, check, error) {
  if (!actor) return false;
  if (!hasDedication(actor)) {
    ui.notifications.warn("Pas sanguimancien");
    return false;
  }
  if (check && !check(actor)) {
    ui.notifications.warn(error);
    return false;
  }
  return true;
}
