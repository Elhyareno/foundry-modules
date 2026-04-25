import { recordDiceRoll, recordRollOutcome } from "./dice-stats.js";
import { recordHeroPointUse } from "./hero-points.js";
import { getSetting } from "./settings.js";

const MODULE_ID = "pf2e-hero-stats";

export function setupChatListeners() {
  Hooks.on("createChatMessage", (message) => {
    onChatMessage(message);
  });
}

function onChatMessage(message) {
  if (!message) return;

  const flags = message.flags?.pf2e;
  if (!flags) return;

  // Track dice rolls
  if (getSetting("trackDiceStats") && message.rolls && message.rolls.length > 0) {
    for (const roll of message.rolls) {
        await recordDiceRoll(message, roll);
    }
    }

  // Track hero point usage
  if (getSetting("trackHeroPoints")) {
    // Check for hero point usage patterns in message content
    if (message.content.includes("Hero Point") || message.content.includes("hero point")) {
      const actor = message.speaker?.actor ? game.actors.get(message.speaker.actor) : null;
      if (actor) {
        recordHeroPointUse(actor, 1, "Hero Point Used");
      }
    }
  }
}
