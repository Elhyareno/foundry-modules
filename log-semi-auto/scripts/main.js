import { MODULE_ID, combatLogs, loadCombatLogs } from "./state.js";
import { getHp } from "./utils.js";
import { trackHpChange } from "./hp-tracker.js";
import { trackNotableAttack } from "./attack-tracker.js";
import { finishCombatLog, createCombatJournalPage } from "./journal.js";
import { registerSettings, getSetting } from "./settings.js";
import { setCombatLog } from "./state.js";
import { registerLogSemiAutoInMatCore } from "./integrations/matcore.js";


Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);
  registerSettings();

  globalThis.LogSemiAuto = {
    openCombatJournal: () => {
      const journalName = game.settings.get(MODULE_ID, "journalName");
      const journal = game.journal.find(j => j.name === journalName);

      if (!journal) {
        ui.notifications.warn(`Journal introuvable : ${journalName}`);
        return;
      }

      journal.sheet.render(true);
    }
  };  
});

Hooks.once("ready", async () => {
  await loadCombatLogs();
  console.log(`${MODULE_ID} | Logs de combat restaurés`);

  const tryRegisterMatCore = () => {
    if (game.matcore?.registerModule) {
      registerLogSemiAutoInMatCore();
      return true;
    }

    return false;
  };

  if (!tryRegisterMatCore()) {
    Hooks.once("matcoreReady", tryRegisterMatCore);
    setTimeout(tryRegisterMatCore, 250);
  }
});

Hooks.on("combatStart", async (combat) => {
  if (!game.user.isGM) return;
  await startCombatLog(combat);
});

Hooks.on("preUpdateActor", (actor, changes) => {
  if (!game.user.isGM) return;
  trackHpChange(actor, changes);
});

Hooks.on("createChatMessage", (message) => {
  if (!game.user.isGM) return;
  trackNotableAttack(message);
});

Hooks.on("deleteCombat", async (combat) => {
  if (!game.user.isGM) return;
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

async function startCombatLog(combat) {
  const combatants = {};

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor) continue;

    const hp = getHp(actor);
    const disposition =
      combatant.token?.disposition ??
      combatant.token?.object?.document?.disposition ??
      0;

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

  const log = {
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

  await setCombatLog(combat.id, log);
}