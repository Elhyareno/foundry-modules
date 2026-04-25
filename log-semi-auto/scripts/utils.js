export function getHp(actor) {
  return {
    value: Number(foundry.utils.getProperty(actor, "system.attributes.hp.value") ?? 0),
    max: Number(foundry.utils.getProperty(actor, "system.attributes.hp.max") ?? 0)
  };
}
