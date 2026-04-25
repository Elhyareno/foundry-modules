import { recordDiceRoll } from "./dice-stats.js";
import { getSetting } from "./settings.js";

const MODULE_ID = "pf2e-hero-stats";

export function setupChatListeners() {
  Hooks.on("updateActor", async (actor, changes, options, _userId) => {
    if (options.heroStatsHandled) return;
    await onChatMessage(message);
  });

  console.log(`${MODULE_ID} | Chat listeners registered`);
}

async function onChatMessage(message) {
  if (!message) return;

  if (!getSetting("trackDiceStats")) return;

  const rolls = message.rolls ?? [];
  if (!rolls.length) return;

  for (const roll of rolls) {
    await recordDiceRoll(message, roll);
  }
}