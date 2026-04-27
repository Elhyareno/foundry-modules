export const MODULE_ID = "sanguimancer-resource";

export const FLAG_DATA = "data";
export const FLAG_FEAT = "feat";
export const FLAG_ACTION = "action";

export const FEAT_KEYS = {
  DEDICATION: "dedication",
  BLOOD_SHIELD: "blood-shield",
  EXSANGUINATE: "exsanguinate",
  TRANSFUSION: "transfusion",
  VENIPUNCTURE: "venipuncture",
};

export const ACTION_KEYS = {
  BLOOD_SHIELD: "blood-shield",
  EXSANGUINATE: "exsanguinate",
  TRANSFUSION: "transfusion",
  VENIPUNCTURE: "venipuncture",
};

export const FEAT_FALLBACK_TERMS = {
  [FEAT_KEYS.DEDICATION]: [
    "sanguimancer dedication",
    "sanguimancer",
    "sanguimancien",
    "dedication sanguimancer",
  ],
  [FEAT_KEYS.BLOOD_SHIELD]: [
    "blood shield",
    "blood-shield",
    "bouclier sanglant",
  ],
  [FEAT_KEYS.EXSANGUINATE]: [
    "exsanguinate",
    "exsanguination",
  ],
  [FEAT_KEYS.TRANSFUSION]: [
    "transfusion",
  ],
  [FEAT_KEYS.VENIPUNCTURE]: [
    "venipuncture",
  ],
};

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[-_']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getLevel(actor) {
  return Number(actor?.system?.details?.level?.value ?? actor?.level ?? 0);
}

export function getMax(actor) {
  return getLevel(actor) * 2;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getTHP(actor) {
  return Number(actor?.system?.attributes?.hp?.temp ?? 0);
}

export function getBestDC(actor) {
  return Math.max(
    Number(actor?.system?.attributes?.classDC?.value ?? 0),
    Number(actor?.system?.attributes?.spellDC?.value ?? 0)
  );
}

export function randomId() {
  return foundry.utils.randomID();
}

export function getUserIdsForActor(actor) {
  if (!actor) return [];

  const ownerIds = game.users
    .filter((user) => user.active && actor.testUserPermission(user, "OWNER"))
    .map((user) => user.id);

  const gmIds = game.users
    .filter((user) => user.active && user.isGM)
    .map((user) => user.id);

  return Array.from(new Set([...ownerIds, ...gmIds]));
}