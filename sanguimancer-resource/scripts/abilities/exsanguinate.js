import { MODULE_ID, getLevel } from "../constants.js";
import { hasExsanguinate, assertSanguimancerFeat } from "../feats.js";
import { postToChat, postPrivateToActor, makeButton } from "../chat.js";

const OPPORTUNITY_FLAG = "exsanguinateOpportunity";

export async function setExsanguinateOpportunity(actor, data = {}) {
  const combat = game.combat;

  const opportunity = {
    available: true,
    round: combat?.round ?? null,
    turn: combat?.turn ?? null,
    targetId: data.targetId ?? null,
    reason: data.reason ?? "Attaque valide",
  };

  await actor.setFlag(MODULE_ID, OPPORTUNITY_FLAG, opportunity);

  const gain = getExsanguinateGain(actor);
  const button = makeButton("Utiliser Exsanguinate", "exsanguinate", {
    actorUuid: actor.uuid,
    });

  await postPrivateToActor(
    actor,
    `
      Exsanguinate disponible.<br>
      Gain : ${gain} PV sanguimanciens temporaires.<br>
      ${button}
    `
  );

  return opportunity;
}

export function getExsanguinateOpportunity(actor) {
  return actor.getFlag(MODULE_ID, OPPORTUNITY_FLAG) ?? null;
}

export async function clearExsanguinateOpportunity(actor) {
  await actor.unsetFlag(MODULE_ID, OPPORTUNITY_FLAG);
}

export function getExsanguinateGain(actor) {
  return Math.max(1, Math.floor(getLevel(actor) / 2));
}

export async function useExsanguinate(actor) {
  if (!assertSanguimancerFeat(actor, hasExsanguinate, "Don Exsanguinate manquant.")) return null;

  const opportunity = getExsanguinateOpportunity(actor);

  if (!opportunity?.available) {
    ui.notifications.warn("Exsanguinate n'est pas disponible.");
    return null;
  }

  const gain = getExsanguinateGain(actor);
  const combat = game.combat;

  const actorCombatant = combat?.combatants?.find((combatant) => combatant.actor?.id === actor.id);

  const expiresRound = (combat?.round ?? 0) + 1;
  const expiresTurn = actorCombatant?.initiative !== undefined
    ? combat.combatants.findIndex((combatant) => combatant.id === actorCombatant.id)
    : -1;

  await game.sanguimancer.addTemporaryResource(actor, gain, "Exsanguinate", {
    expiresRound,
    expiresTurn,
  });

  await clearExsanguinateOpportunity(actor);

  postToChat(
    actor,
    `Exsanguinate : +${gain} PV sanguimanciens temporaires jusqu'à la fin du prochain tour.`
  );

  return gain;
}