import { PF2eActor } from "../../lib-pf2e-tools/scripts/index.js";

export function getActorLevel(actor) {
  return PF2eActor.getLevel(actor);
}

export function getHP(actor) {
  return PF2eActor.getHP(actor);
}

export function isVitalityActor(actor) {
  if (!actor) return false;
  if (actor.type !== "character") return false;

  return PF2eActor.hasClass(actor, "mystic");
}

export function getSpellcastingDCRank(actor) {
  return PF2eActor.getSpellcastingDCRank(actor);
}