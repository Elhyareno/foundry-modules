import { getSetting } from "./settings.js";

/* =========================
   Acteur / message
========================= */

export function getMessageActor(message) {
  const actorId = message?.speaker?.actor;
  if (!actorId) return null;

  return game.actors.get(actorId) ?? null;
}

export function isPlayerCharacter(actor) {
  if (!actor) return false;

  return actor.type === "character";
}

export function shouldIgnoreMessage(message, actor) {
  if (!message || !actor) return true;

  if (getSetting("trackOnlyPlayerCharacters") && !isPlayerCharacter(actor)) {
    return true;
  }

  if (getSetting("ignorePrivateRolls") && isPrivateMessage(message)) {
    return true;
  }

  return false;
}

export function isPrivateMessage(message) {
  const whisper = message.whisper ?? [];
  const blind = message.blind ?? false;

  return blind || whisper.length > 0;
}

/* =========================
   Lecture des dés
========================= */

export function getNaturalD20FromRoll(roll) {
  if (!roll) return null;

  const d20 = roll.dice?.find(die => die.faces === 20);
  if (!d20) return null;

  const activeResult = d20.results?.find(result => result.active !== false);
  if (!activeResult) return null;

  return activeResult.result ?? null;
}

export function hasD20(roll) {
  return getNaturalD20FromRoll(roll) !== null;
}

/* =========================
   PF2e / SF2e context
========================= */

export function getSystemFlags(message) {
  return message?.flags?.pf2e ?? message?.flags?.sf2e ?? {};
}

export function getSystemContext(message) {
  return (
    message?.flags?.pf2e?.context ??
    message?.flags?.sf2e?.context ??
    {}
  );
}

export function getRollType(message) {
  const context = getSystemContext(message);

  const type = context.type ?? context.rollType ?? "";

  if (type === "attack-roll") return "attack";
  if (type === "saving-throw") return "save";
  if (type === "skill-check") return "skill";
  if (type === "perception-check") return "perception";
  if (type === "flat-check") return "flat";

  const domains = context.domains ?? [];

  if (domains.includes("attack-roll")) return "attack";
  if (domains.includes("attack")) return "attack";

  if (domains.includes("saving-throw")) return "save";
  if (domains.includes("save")) return "save";

  if (domains.includes("skill-check")) return "skill";
  if (domains.includes("skill")) return "skill";

  if (domains.includes("perception-check")) return "perception";
  if (domains.includes("perception")) return "perception";

  if (domains.includes("flat-check")) return "flat";
  if (domains.includes("flat")) return "flat";

  // SF2e semble parfois stocker le nom de compétence dans modifierName.
  if (context.modifierName) {
    return "skill";
  }

  return "other";
}

export function getDegreeOfSuccess(message) {
  const context = getSystemContext(message);

  return (
    context.outcome ??
    context.degreeOfSuccess ??
    context.degreeOfSuccessLabel ??
    context.result?.degreeOfSuccess ??
    context.result?.outcome ??
    context.roll?.degreeOfSuccess ??
    context.check?.degreeOfSuccess ??
    null
  );
}

export function normalizeOutcome(outcome) {
  if (outcome === null || outcome === undefined) return null;

  // PF2e utilise souvent :
  // 0 = échec critique
  // 1 = échec
  // 2 = réussite
  // 3 = réussite critique
  if (typeof outcome === "number") {
    const numericMap = {
      0: "criticalFailure",
      1: "failure",
      2: "success",
      3: "criticalSuccess"
    };

    return numericMap[outcome] ?? null;
  }

  const normalized = String(outcome)
    .trim()
    .replaceAll("_", "-")
    .toLowerCase();

  const map = {
    criticalsuccess: "criticalSuccess",
    success: "success",
    failure: "failure",
    criticalfailure: "criticalFailure",

    "critical-success": "criticalSuccess",
    "critical success": "criticalSuccess",
    "crit-success": "criticalSuccess",
    "crit success": "criticalSuccess",

    "critical-failure": "criticalFailure",
    "critical failure": "criticalFailure",
    "crit-failure": "criticalFailure",
    "crit failure": "criticalFailure",

    "degree-of-success-0": "criticalFailure",
    "degree-of-success-1": "failure",
    "degree-of-success-2": "success",
    "degree-of-success-3": "criticalSuccess"
  };

  return map[normalized] ?? null;
}

/* =========================
   Divers
========================= */

export function duplicateData(data) {
  return foundry.utils.deepClone(data);
}

export function nowIso() {
  return new Date().toISOString();
}