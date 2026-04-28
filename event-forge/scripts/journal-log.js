import { FCoreJournal, FCoreUI } from "../../lib-foundry-core/scripts/index.js";

const JOURNAL_NAME = "Event Forge - Journal des événements";

export async function logEventCreation(data) {
  const journal = await FCoreJournal.getOrCreate(JOURNAL_NAME);

  const content = `
    <h1>${data.title}</h1>
    <p><strong>ID :</strong> ${data.eventId}</p>

    <p><strong>Compétence :</strong> ${data.skillLabel}</p>
    <p><strong>Niveau :</strong> ${data.eventLevel}</p>
    <p><strong>DD de base :</strong> ${data.baseDc}</p>

    <p><strong>Difficulté :</strong>
      ${data.difficultyLabel}
      (${data.difficultyAdjustment >= 0 ? "+" : ""}${data.difficultyAdjustment})
    </p>

    <p><strong>Rareté :</strong> ${data.rarity}</p>
    <p><strong>DD final :</strong> ${data.dc}</p>

    <h2>Ambiance</h2>
    <p>${data.fluff}</p>

    <h2>Résultats</h2>
    <ul id="event-results-${data.eventId}">
      <li><em>Aucun jet pour le moment.</em></li>
    </ul>
  `;

  await FCoreJournal.addTextPage(journal, {
    name: data.title,
    content
  });
}

export async function logEventResult({ eventId, title, actorName, total, dc, degree }) {
  const journal = await FCoreJournal.getOrCreate(JOURNAL_NAME);

  const page = journal.pages.find(p =>
    p.name === title && p.text.content.includes(eventId)
  );

  if (!page) {
    FCoreUI.warn("Page de journal introuvable pour cet événement.");
    return;
  }

  let content = page.text.content;

  content = content.replace(
    `<li><em>Aucun jet pour le moment.</em></li>`,
    ""
  );

  content = content.replace(
    `</ul>`,
    `<li><strong>${actorName}</strong> : ${total} vs ${dc} — ${degree}</li></ul>`
  );

  await page.update({
    "text.content": content
  });
}