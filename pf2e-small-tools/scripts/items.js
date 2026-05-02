import { getProperty } from "./utils.js";

const HP_CANDIDATES = [
  {
    valuePath: "system.hp.value",
    maxPath: "system.hp.max"
  },
  {
    valuePath: "system.hitPoints.value",
    maxPath: "system.hitPoints.max"
  },
  {
    valuePath: "system.attributes.hp.value",
    maxPath: "system.attributes.hp.max"
  }
];

export function getItemHpData(item) {
  for (const candidate of HP_CANDIDATES) {
    const value = Number(getProperty(item, candidate.valuePath));
    const max = Number(getProperty(item, candidate.maxPath));

    if (Number.isFinite(value) && Number.isFinite(max) && max > 0) {
      return {
        value,
        max,
        valuePath: candidate.valuePath,
        maxPath: candidate.maxPath
      };
    }
  }

  return null;
}

export function isItemDamaged(item) {
  const hp = getItemHpData(item);
  return Boolean(hp && hp.value < hp.max);
}

export function getRepairableItems(actor, { damagedOnly = true } = {}) {
  if (!actor?.items) return [];

  return actor.items
    .filter(item => {
      const hp = getItemHpData(item);
      if (!hp) return false;
      return damagedOnly ? hp.value < hp.max : true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export async function updateItemHp({ actorId, itemId, mode, amount }) {
  const actor = game.actors.get(actorId);
  const item = actor?.items?.get(itemId);

  if (!actor || !item) {
    ui.notifications.warn("Objet introuvable pour la mise à jour des PV.");
    return null;
  }

  const hp = getItemHpData(item);
  if (!hp) {
    ui.notifications.warn(`L’objet ${item.name} ne possède pas de PV exploitables.`);
    return null;
  }

  const numericAmount = Math.max(0, Number(amount ?? 0));
  const newValue = mode === "damage"
    ? Math.max(0, hp.value - numericAmount)
    : Math.min(hp.max, hp.value + numericAmount);

  await item.update({
    [hp.valuePath]: newValue
  });

  return {
    actor,
    item,
    before: hp.value,
    after: newValue,
    max: hp.max,
    amount: numericAmount,
    mode
  };
}
