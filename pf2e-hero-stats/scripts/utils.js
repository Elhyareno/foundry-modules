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

  // PF2e utilise généralement type === "character" pour les PJ.
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
   PF2e context
========================= */

export function getPf2eContext(message) {
  return message?.flags?.pf2e?.context ?? {};
}

export function getRollType(message) {
  const context = getPf2eContext(message);

  const type = context.type ?? context.rollType ?? "";

  if (type === "attack-roll") return "attack";
  if (type === "saving-throw") return "save";
  if (type === "skill-check") return "skill";
  if (type === "perception-check") return "perception";
  if (type === "flat-check") return "flat";

  // Certaines versions ou certains modules peuvent stocker différemment.
  const domains = context.domains ?? [];

  if (domains.includes("attack-roll")) return "attack";
  if (domains.includes("saving-throw")) return "save";
  if (domains.includes("skill-check")) return "skill";
  if (domains.includes("perception")) return "perception";

  return "other";
}

export function getDegreeOfSuccess(message) {
  const context = getPf2eContext(message);

  return context.outcome ?? null;
}

export function normalizeOutcome(outcome) {
  if (!outcome) return null;

  const map = {
    criticalSuccess: "criticalSuccess",
    success: "success",
    failure: "failure",
    criticalFailure: "criticalFailure",

    "critical-success": "criticalSuccess",
    "critical success": "criticalSuccess",
    "crit-success": "criticalSuccess",

    "critical-failure": "criticalFailure",
    "critical failure": "criticalFailure",
    "crit-failure": "criticalFailure"
  };

  return map[outcome] ?? null;
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