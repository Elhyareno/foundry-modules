import {
  MODULE_ID,
  FLAG_FEAT,
  FEAT_KEYS,
  FEAT_FALLBACK_TERMS,
  normalizeText,
} from "./constants.js";

function itemFeatFlag(item) {
  return item?.getFlag?.(MODULE_ID, FLAG_FEAT)
    ?? item?.flags?.[MODULE_ID]?.[FLAG_FEAT]
    ?? item?.system?.flags?.[MODULE_ID]?.[FLAG_FEAT]
    ?? null;
}

function itemMatchesFallback(item, featKey) {
  const terms = FEAT_FALLBACK_TERMS[featKey] ?? [];
  const slug = normalizeText(item?.slug ?? item?.system?.slug);
  const name = normalizeText(item?.name);

  return terms.some((term) => {
    const normalizedTerm = normalizeText(term);
    return slug.includes(normalizedTerm) || name.includes(normalizedTerm);
  });
}

export function hasFeatKey(actor, featKey) {
  if (!actor) return false;

  const feats = actor.itemTypes?.feat ?? [];

  return feats.some((feat) => {
    const flag = itemFeatFlag(feat);
    if (flag && normalizeText(flag) === normalizeText(featKey)) return true;

    return itemMatchesFallback(feat, featKey);
  });
}

export function hasDedication(actor) {
  return hasFeatKey(actor, FEAT_KEYS.DEDICATION);
}

export function hasFeat(actor, termsOrKey = []) {
  if (typeof termsOrKey === "string" && Object.values(FEAT_KEYS).includes(termsOrKey)) {
    return hasFeatKey(actor, termsOrKey);
  }

  const terms = Array.isArray(termsOrKey) ? termsOrKey : [termsOrKey];
  const feats = actor?.itemTypes?.feat ?? [];

  return feats.some((feat) => {
    const slug = normalizeText(feat?.slug ?? feat?.system?.slug);
    const name = normalizeText(feat?.name);

    return terms.some((term) => {
      const normalizedTerm = normalizeText(term);
      return slug.includes(normalizedTerm) || name.includes(normalizedTerm);
    });
  });
}

export const hasBloodShield = (actor) => hasFeatKey(actor, FEAT_KEYS.BLOOD_SHIELD);
export const hasExsanguinate = (actor) => hasFeatKey(actor, FEAT_KEYS.EXSANGUINATE);
export const hasTransfusion = (actor) => hasFeatKey(actor, FEAT_KEYS.TRANSFUSION);
export const hasVenipuncture = (actor) => hasFeatKey(actor, FEAT_KEYS.VENIPUNCTURE);

export function assertSanguimancerFeat(actor, check, error) {
  if (!actor) return false;

  if (!hasDedication(actor)) {
    ui.notifications.warn("Pas sanguimancien.");
    return false;
  }

  if (check && !check(actor)) {
    ui.notifications.warn(error ?? "Don sanguimancien manquant.");
    return false;
  }

  return true;
}