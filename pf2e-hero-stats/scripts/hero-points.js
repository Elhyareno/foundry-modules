const MODULE_ID = "pf2e-hero-stats";

let heroPointsLog = [];

export function initHeroPoints() {
  heroPointsLog = [];
}

export function recordHeroPointUse(actor, amount, reason) {
  if (!actor) return;

  const entry = {
    actor: actor.name,
    actorId: actor.id,
    amount: amount || 1,
    reason: reason || "Hero Point Used",
    timestamp: new Date()
  };

  heroPointsLog.push(entry);
}

export function getHeroPointsLog() {
  return [...heroPointsLog];
}

export function getHeroPointsUsedByActor(actorId) {
  return heroPointsLog
    .filter(entry => entry.actorId === actorId)
    .reduce((total, entry) => total + entry.amount, 0);
}

export function getTotalHeroPointsUsed() {
  return heroPointsLog.reduce((total, entry) => total + entry.amount, 0);
}

export function resetHeroPointsLog() {
  initHeroPoints();
}
