import { FLAGS } from "../constants.js";
import {
  getActorFromMessage,
  getFlag,
  getItemFromMessage,
  getOutcomeFromMessage,
  hasSpellshot,
  isAttackRollMessage,
  isFirearmOrCrossbow,
  postChat,
  setFlag
} from "../utils.js";

export async function trackMissedShot(message) {
  if (!isAttackRollMessage(message)) return;

  const actor = getActorFromMessage(message);
  if (!actor || !hasSpellshot(actor)) return;

  const item = getItemFromMessage(message, actor);
  if (!item || !isFirearmOrCrossbow(item)) return;

  const outcome = getOutcomeFromMessage(message);
  if (!["failure", "criticalFailure"].includes(outcome)) return;

  await setFlag(actor, FLAGS.LAST_MISSED_SHOT, {
    itemId: item.id,
    weaponName: item.name,
    timestamp: Date.now()
  });

  await postChat(actor, "Recall Ammunition", [
    `Tir raté mémorisé avec ${item.name}.`,
    "La réaction peut être déclenchée via la macro du module."
  ]);
}

export async function useRecallAmmunition(actor) {
  if (!actor || !hasSpellshot(actor)) {
    ui.notifications.warn("Cet acteur n'a pas Spellshot Dedication.");
    return;
  }

  const data = getFlag(actor, FLAGS.LAST_MISSED_SHOT, null);
  if (!data) {
    ui.notifications.info("Aucun tir raté récent n'a été mémorisé.");
    return;
  }

  await postChat(actor, "Recall Ammunition", [
    `La munition manquée revient et se recharge dans ${data.weaponName}.`,
    "Si c'était une munition magique ou alchimique activée, sa réactivation reste à gérer manuellement."
  ]);
}