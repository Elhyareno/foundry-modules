import { MODULE_ID, combatLogs } from "./state.js";
import { getHp } from "./utils.js";
import { trackHpChange } from "./hp-tracker.js";
import { trackNotableAttack } from "./attack-tracker.js";
import { finishCombatLog, createCombatJournalPage } from "./journal.js";
import { registerSettings, getSetting } from "./settings.js";


Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);
  registerSettings();
});

Hooks.on("combatStart", (combat) => {
  startCombatLog(combat);
});

Hooks.on("preUpdateActor", (actor, changes) => {
  trackHpChange(actor, changes);
});

Hooks.on("createChatMessage", (message) => {
  trackNotableAttack(message);
});

Hooks.on("deleteCombat", async (combat) => {
  await finishCombatLog(combat);
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  html.querySelectorAll?.("[data-action='lsa-save-combat']").forEach(button => {
    button.addEventListener("click", async () => {
      const log = message.getFlag(MODULE_ID, "combatLog");

      if (!log) {
        ui.notifications.warn("Aucun rapport de combat trouvé.");
        return;
      }

      await createCombatJournalPage(log);

      ui.notifications.info("Rencontre enregistrée dans le journal de combat.");
      button.disabled = true;
      button.textContent = "Rencontre enregistrée";
    });
  });
});

function startCombatLog(combat) {
  const combatants = {};

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor) continue;

    const hp = getHp(actor);
    const disposition = combatant.token?.disposition ?? combatant.token?.object?.document?.disposition ?? 0;

    combatants[actor.id] = {
      actorId: actor.id,
      tokenId: combatant.tokenId,
      name: actor.name,
      img: actor.img,
      type: actor.type,
      alliance: disposition === 1 ? "ally" : disposition === -1 ? "enemy" : "neutral",
      startHp: hp.value,
      maxHp: hp.max,
      endHp: hp.value,
      damageTaken: 0,
      healingReceived: 0,
      dropped: false
    };
  }

  combatLogs[combat.id] = {
    id: combat.id,
    sceneName: combat.scene?.name ?? "Lieu inconnu",
    startedAt: new Date().toLocaleString(),
    endedAt: null,
    rounds: 0,
    combatants,
    notableAttacks: {
      playerCrit: null,
      enemyCrit: null
    }
  };
}
