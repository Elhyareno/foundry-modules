import { getVitalityValue, setVitality } from "./resource.js";
import { getHP } from "./actor.js";

/**
 * Get the current target of the user
 * @returns {Actor|undefined} The targeted actor
 */
function getTarget() {
  return Array.from(game.user.targets)[0]?.actor;
}

/**
 * Transfer vitality to target to heal them
 * @param {Actor} source - The actor transferring vitality
 * @param {HTMLElement} panel - The vitality panel
 */
export async function transferVitalityToTarget(source, panel) {
  const target = getTarget();
  if (!target) return;

  const hp = getHP(target);
  const missing = hp.max - hp.value;

  const max = getVitalityValue(source);
  const amount = Math.min(missing, max);

  const healed = Math.min(amount, missing);

  await game.vnWidget.transferVitalityToTarget(source.id, target.id, amount);
}

/**
 * Transfer maximum vitality to target to heal them
 * @param {Actor} source - The actor transferring vitality
 */
export async function transferMaxVitalityToTarget(source) {
  const target = getTarget();
  if (!target) return;

  const hp = getHP(target);
  const missing = hp.max - hp.value;

  const vn = getVitalityValue(source);
  const heal = Math.min(vn, missing);

  await game.vnWidget.transferVitalityToTarget(source.id, target.id, amount);
}
export async function transferVitalityToActor(source, target, requestedAmount = null) {
  if (!source || !target) return null;

  const hp = getHP(target);
  if (!hp) return null;

  const missing = hp.max - hp.value;
  if (missing <= 0) return null;

  const vitality = getVitalityValue(source);
  if (vitality <= 0) return null;

  const desiredAmount = requestedAmount === null
    ? vitality
    : Number(requestedAmount);

  if (!Number.isFinite(desiredAmount) || desiredAmount <= 0) return null;

  const healed = Math.min(desiredAmount, missing, vitality);

  if (healed <= 0) return null;

  await target.update({
    "system.attributes.hp.value": hp.value + healed
  });

  await setVitality(source, vitality - healed);

  return {
    source,
    target,
    healed,
    remainingVitality: vitality - healed,
    targetHP: hp.value + healed,
    targetMaxHP: hp.max
  };
}