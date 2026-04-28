import { FLAG_SCOPE, FLAG_KEY } from "./constants.js";
import { PF2eActor, PF2eResources } from "../../lib-pf2e-tools/scripts/index.js";

export function getVitalityMax(actor) {
  const level = Math.max(1, Number(PF2eActor.getLevel(actor) ?? 1));
  return 6 + (level * 4);
}

export function clampVitality(actor, value) {
  return PF2eResources.clamp(value, 0, getVitalityMax(actor));
}

export function getVitalityValue(actor, max = getVitalityMax(actor)) {
  const flag = PF2eResources.getFlagResource(actor, FLAG_SCOPE, FLAG_KEY, {});
  return PF2eResources.clamp(flag.value ?? 0, 0, max);
}

export async function setVitality(actor, value) {
  const cleanValue = clampVitality(actor, value);

  await PF2eResources.setFlagResource(actor, FLAG_SCOPE, FLAG_KEY, {
    value: cleanValue
  });
}

export async function rechargeVitality(actor) {
  await setVitality(actor, getVitalityMax(actor));
}