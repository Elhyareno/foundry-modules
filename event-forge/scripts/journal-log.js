const JOURNAL_NAME = "Event Forge - Journal des événements";

export async function getOrCreateJournal() {
  let journal = game.journal.find(j => j.name === JOURNAL_NAME);

  if (!journal) {
    journal = await JournalEntry.create({
      name: JOURNAL_NAME,
      ownership: {
        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
        [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      }
    });
  }

  return journal;
}

export async function logEventCreation({ eventId, title, skillLabel, dc, fluff, success, failure, criticalSuccess, criticalFailure }) {
  const journal = await getOrCreateJournal();

  await JournalEntryPage.create({
    name: title,
    type: "text",
    text: {
      content: `
        <h1>${title}</h1>
        <p><strong>ID :</strong> ${eventId}</p>
        <p><strong>Compétence :</strong> ${skillLabel}</p>
        <p><strong>DD :</strong> ${dc}</p>

        <h2>Ambiance</h2>
        <p>${fluff}</p>

        <h2>Réussite critique</h2>
        <p>${foundry.utils.escapeHTML(criticalSuccess)}</p>

        <h2>Réussite</h2>
        <p>${foundry.utils.escapeHTML(success)}</p>

        <h2>Échec</h2>
        <p>${foundry.utils.escapeHTML(failure)}</p>

        <h2>Échec critique</h2>
        <p>${foundry.utils.escapeHTML(criticalFailure)}</p>

        <h2>Résultats</h2>
        <ul id="event-results-${eventId}">
          <li><em>Aucun jet pour le moment.</em></li>
        </ul>
      `
    }
  }, { parent: journal });
}

export async function logEventResult({ eventId, title, actorName, total, dc, degree }) {
  const journal = await getOrCreateJournal();

  const page = journal.pages.find(p => {
    return p.name === title && p.text.content.includes(eventId);
  });

  if (!page) {
    ui.notifications.warn("Page de journal introuvable pour cet événement.");
    return;
  }

  let content = page.text.content;

  content = content.replace(
    `<li><em>Aucun jet pour le moment.</em></li>`,
    ""
  );

  content = content.replace(
    `</ul>`,
    `<li><strong>${actorName}</strong> : ${total} contre DD ${dc} — ${degree}</li></ul>`
  );

  await page.update({
    "text.content": content
  });
}