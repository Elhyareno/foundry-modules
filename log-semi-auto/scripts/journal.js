import { MODULE_ID, JOURNAL_NAME, combatLogs, deleteCombatLog } from "./state.js";
import { buildPublicSummary, buildJournalContent, getGlobalStats } from "./summaries.js";
import { getSetting } from "./settings.js";
import {handleEncounterXp} from "./xp-tracker.js";

export async function finishCombatLog(combat) {
    const log = combatLogs[combat.id];
    if (!log) return;

    const { determineBattleResult } = await import("./summaries.js");

    log.endedAt = new Date().toLocaleString();
    log.rounds = combat.round ?? 0;
    log.result = determineBattleResult(log);

    // Handle XP awarding
    await handleEncounterXp(log);

    if (getSetting("sendPublicSummary")) {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker(),
            content: buildPublicSummary(log)
        });
    }

    if (getSetting("sendPrivateReports")) {
        await sendPrivatePlayerReports(log);
    }

    if (getSetting("sendGmArchivePrompt")) {
        await sendGmSavePrompt(log);
    }

    await deleteCombatLog(combat.id);
}

export async function createCombatJournalPage(log) {
  const journalName = getSetting("journalName");
  let journal = game.journal.find(j => j.name === journalName);
  if (!journal) {
    journal = await JournalEntry.create({
      name: journalName
    });
  }

  const date = new Date().toLocaleDateString();
  const pageTitle = `${date} - ${log.sceneName} - ${log.result}`;

  await JournalEntryPage.create({
    name: pageTitle,
    type: "text",
    text: {
      content: buildJournalContent(log)
    }
  }, { parent: journal });
}

async function sendPrivatePlayerReports(log) {
  const gmIds = game.users.filter(u => u.isGM).map(u => u.id);
  const { buildPersonalReport } = await import("./summaries.js");

  for (const user of game.users.filter(u => !u.isGM && u.active)) {
    const ownedCombatants = Object.values(log.combatants).filter(c => {
      const actor = game.actors.get(c.actorId);
      return actor?.testUserPermission(user, "OWNER");
    });

    if (!ownedCombatants.length) continue;

    const content = buildPersonalReport(log, ownedCombatants);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      whisper: [user.id, ...gmIds],
      content
    });
  }
}

async function sendGmSavePrompt(log) {
  const gmIds = game.users.filter(u => u.isGM).map(u => u.id);
  const stats = getGlobalStats(log);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    whisper: gmIds,
    flags: {
      [MODULE_ID]: {
        combatLog: log
      }
    },
    content: `<section class="lsa-report">
    <h2 class="lsa-title">📚 Archiver la rencontre ?</h2>

    <p class="lsa-lead">
      <strong>Lieu :</strong> ${log.sceneName}<br>
      <strong>Résultat :</strong> <span class="lsa-result">${log.result}</span><br>
      <strong>Durée :</strong> ${log.rounds} round(s)
    </p>

    <div class="lsa-stat-grid">
      <div class="lsa-stat">
        <span class="lsa-stat-label">Dégâts alliés subis</span>
        <span class="lsa-stat-value">${stats.damageToAllies}</span>
      </div>

      <div class="lsa-stat">
        <span class="lsa-stat-label">Dégâts ennemis subis</span>
        <span class="lsa-stat-value">${stats.damageToEnemies}</span>
      </div>
    </div>

    <button type="button" class="lsa-button" data-action="lsa-save-combat">
      📜 Ajouter au journal de combat
    </button>
  </section>
`
  });
}
