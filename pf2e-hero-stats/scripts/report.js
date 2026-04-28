import { FCoreChat } from "../../lib-foundry-core/scripts/index.js";
import { getSetting } from "./settings.js";

export function buildStatsReport(stats) {
  const format = getSetting("reportFormat");

  if (format === "minimal") {
    return `
      <div class="hero-stats-report minimal">
        🎲 ${stats.totals.rolls} jets |
        20 : ${stats.totals.natural20} |
        1 : ${stats.totals.natural1}
      </div>
    `;
  }

  if (format === "summary") {
    return `
      <div class="hero-stats-report summary">
        <h3>🎲 Résumé des dés</h3>
        <p>Total : ${stats.totals.rolls}</p>
        <p>20 : ${stats.totals.natural20} | 1 : ${stats.totals.natural1}</p>
      </div>
    `;
  }

  return `
    <section class="hero-stats-report detailed">
      <h3>🎲 Rapport des dés</h3>

      <ul>
        <li>Total de jets : <strong>${stats.totals.rolls}</strong></li>
        <li>20 naturels : <strong>${stats.totals.natural20}</strong></li>
        <li>1 naturels : <strong>${stats.totals.natural1}</strong></li>
        <li>Succès critiques : <strong>${stats.totals.criticalSuccesses}</strong></li>
        <li>Succès : <strong>${stats.totals.successes}</strong></li>
        <li>Échecs : <strong>${stats.totals.failures}</strong></li>
        <li>Échecs critiques : <strong>${stats.totals.criticalFailures}</strong></li>
      </ul>
    </section>
  `;
}

export async function sendStatsReport(stats) {
  const content = buildStatsReport(stats);
  await FCoreChat.send(content);
}