const MODULE_ID = "pf2e-hero-stats";

let diceStats = {
  rolls: [],
  successes: 0,
  criticalSuccesses: 0,
  failures: 0,
  criticalFailures: 0
};

export function initDiceStats() {
  diceStats = {
    rolls: [],
    successes: 0,
    criticalSuccesses: 0,
    failures: 0,
    criticalFailures: 0
  };
}

export function recordDiceRoll(roll) {
  if (!roll) return;

  diceStats.rolls.push({
    formula: roll.formula,
    total: roll.total,
    timestamp: new Date()
  });
}

export function recordRollOutcome(outcome) {
  const outcomes = {
    "criticalSuccess": "criticalSuccesses",
    "success": "successes",
    "failure": "failures",
    "criticalFailure": "criticalFailures"
  };

  if (outcomes[outcome]) {
    diceStats[outcomes[outcome]]++;
  }
}

export function getDiceStats() {
  const total = diceStats.rolls.length;
  const successRate = total > 0 
    ? ((diceStats.successes + diceStats.criticalSuccesses) / total * 100).toFixed(2)
    : 0;

  return {
    total,
    successes: diceStats.successes,
    criticalSuccesses: diceStats.criticalSuccesses,
    failures: diceStats.failures,
    criticalFailures: diceStats.criticalFailures,
    successRate
  };
}

export function resetDiceStats() {
  initDiceStats();
}
