import { FLAGS, MODULE_ID } from "../constants.js";
import {
  chooseEnergyType,
  getActorFromMessage,
  getFlag,
  getItemFromMessage,
  getWeaponDamageDice,
  hasSpellshot,
  isDamageRollMessage,
  isFirearmOrCrossbow,
  postChat,
  setFlag
} from "../utils.js";

export async function initializeEnergyShotForCombat(combat) {
  if (!combat?.started) return;

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || !hasSpellshot(actor)) continue;

    await setFlag(actor, FLAGS.ENERGY_SHOT_ACTIVE, true);
    await setFlag(actor, FLAGS.ENERGY_SHOT_REMAINING, 3);
    await setFlag(actor, FLAGS.ENERGY_SHOT_COMBAT_ID, combat.id);

    await postChat(actor, "Energy Shot", [
      "Les 3 premières Strikes de cette rencontre avec un firearm ou une crossbow gagnent des dégâts d’énergie bonus.",
      "Le type est choisi à chaque tir."
    ]);
  }
}

export async function resetEnergyShotOutsideCombat(actors) {
  for (const actor of actors) {
    if (!actor || !hasSpellshot(actor)) continue;
    await setFlag(actor, FLAGS.ENERGY_SHOT_ACTIVE, false);
    await setFlag(actor, FLAGS.ENERGY_SHOT_REMAINING, 0);
    await setFlag(actor, FLAGS.ENERGY_SHOT_COMBAT_ID, null);
  }
}

export async function handleEnergyShotDamage(message) {
  if (!isDamageRollMessage(message)) return;

  const actor = getActorFromMessage(message);
  if (!actor || !hasSpellshot(actor)) return;

  const active = getFlag(actor, FLAGS.ENERGY_SHOT_ACTIVE, false);
  const remaining = getFlag(actor, FLAGS.ENERGY_SHOT_REMAINING, 0);

  if (!active || remaining <= 0) return;

  const item = getItemFromMessage(message, actor);
  if (!item || !isFirearmOrCrossbow(item)) return;

  const damageDice = getWeaponDamageDice(item);
  const chosenType = await chooseEnergyType(actor);
  if (!chosenType) return;

  const bonusRoll = await (new Roll(String(damageDice))).evaluate();

  await bonusRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `Energy Shot • ${chosenType} • +${damageDice} dégâts`
  });

  const newRemaining = Math.max(0, remaining - 1);
  await setFlag(actor, FLAGS.ENERGY_SHOT_REMAINING, newRemaining);

  if (newRemaining === 0) {
    await setFlag(actor, FLAGS.ENERGY_SHOT_ACTIVE, false);

    await postChat(actor, "Energy Shot", [
      "Les trois tirs enchantés de cette rencontre ont été consommés."
    ]);
  }
}