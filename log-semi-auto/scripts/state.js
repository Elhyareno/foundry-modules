export const MODULE_ID = "log-semi-auto";

export let combatLogs = {};

export function getCombatLogs() {
  return combatLogs;
}

export async function loadCombatLogs() {
  const stored = game.settings.get(MODULE_ID, "persistedCombatLogs");
  combatLogs = stored && typeof stored === "object" ? stored : {};
}

export async function saveCombatLogs() {
  await game.settings.set(MODULE_ID, "persistedCombatLogs", combatLogs);
}

export async function setCombatLog(combatId, log) {
  combatLogs[combatId] = log;
  await saveCombatLogs();
}

export async function deleteCombatLog(combatId) {
  delete combatLogs[combatId];
  await saveCombatLogs();
}