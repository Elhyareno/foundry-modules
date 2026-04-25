import { getDiceStats } from "./dice-stats.js";
import { getTotalHeroPointsUsed, getHeroPointsLog } from "./hero-points.js";
import { getSetting } from "./settings.js";

const MODULE_ID = "pf2e-hero-stats";

export function generateCombatReport() {
  const format = getSetting("reportFormat");
  
  switch (format) {
    case "summary":
      return generateSummaryReport();
    case "minimal":
      return generateMinimalReport();
    case "detailed":
    default:
      return generateDetailedReport();
  }
}

function generateDetailedReport() {
  const diceStats = getDiceStats();
  const heroPointsUsed = getTotalHeroPointsUsed();
  const heroPointsLog = getHeroPointsLog();

  const diceStatsHtml = `
    <div class="hero-stats-dice">
      <h3>📊 Dice Statistics</h3>
      <p>Total Rolls: <strong>${diceStats.total}</strong></p>
      <p>Critical Successes: <strong>${diceStats.criticalSuccesses}</strong></p>
      <p>Successes: <strong>${diceStats.successes}</strong></p>
      <p>Failures: <strong>${diceStats.failures}</strong></p>
      <p>Critical Failures: <strong>${diceStats.criticalFailures}</strong></p>
      <p>Success Rate: <strong>${diceStats.successRate}%</strong></p>
    </div>
  `;

  const heroPointsHtml = `
    <div class="hero-stats-points">
      <h3>⭐ Hero Points Used</h3>
      <p>Total: <strong>${heroPointsUsed}</strong></p>
      <ul>
        ${heroPointsLog.map(entry => `
          <li>${entry.actor}: ${entry.amount} point(s) - ${entry.reason}</li>
        `).join("")}
      </ul>
    </div>
  `;

  return `
    <section class="hero-stats-report">
      ${diceStatsHtml}
      ${heroPointsHtml}
    </section>
  `;
}

function generateSummaryReport() {
  const diceStats = getDiceStats();
  const heroPointsUsed = getTotalHeroPointsUsed();

  return `
    <section class="hero-stats-report summary">
      <h3>⚔️ Combat Summary</h3>
      <p>Total Rolls: <strong>${diceStats.total}</strong> | Success Rate: <strong>${diceStats.successRate}%</strong></p>
      <p>Hero Points Used: <strong>${heroPointsUsed}</strong></p>
    </section>
  `;
}

function generateMinimalReport() {
  const diceStats = getDiceStats();
  const heroPointsUsed = getTotalHeroPointsUsed();

  return `
    <section class="hero-stats-report minimal">
      <p>Rolls: ${diceStats.total} | Success: ${diceStats.successRate}% | Hero Points: ${heroPointsUsed}</p>
    </section>
  `;
}

export async function saveReportToJournal(reportContent) {
  const journalName = "Hero Stats Reports";
  let journal = game.journal.getName(journalName);

  if (!journal) {
    journal = await JournalEntry.create({
      name: journalName
    });
  }

  const date = new Date().toLocaleString();
  await JournalEntryPage.create({
    name: `Report - ${date}`,
    type: "text",
    text: {
      content: reportContent
    }
  }, { parent: journal });
}
