const MODULE_ID = "log-semi-auto";
const JOURNAL_NAME = "Log des combats";
const PAGE_NAME = "Chroniques de bataille";

let combatLogs = {};

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);
});

Hooks.on("combatStart", (combat) => {
  startCombatLog(combat);
});

Hooks.on("preUpdateActor", (actor, changes) => {
  trackHpChange(actor, changes);
});

Hooks.on("deleteCombat", async (combat) => {
  await finishCombatLog(combat);
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  html.querySelectorAll?.("[data-action='lsa-add-journal']").forEach(button => {
    button.addEventListener("click", async () => {
      const logId = button.dataset.logId;
      const data = message.getFlag(MODULE_ID, "combatLog");

      if (!data) {
        ui.notifications.warn("Aucune donnée de log trouvée.");
        return;
      }

      await appendCombatLogToJournal(data);
      ui.notifications.info("Combat ajouté au journal.");
      button.disabled = true;
      button.textContent = "Ajouté au journal";
    });
  });
});

function startCombatLog(combat) {
  const combatants = {};

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor) continue;

    const hp = getHp(actor);

    combatants[actor.id] = {
      name: actor.name,
      img: actor.img,
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
    name: combat.scene?.name ?? "Scène inconnue",
    startedAt: new Date().toLocaleString(),
    rounds: 0,
    combatants
  };

  console.log(`${MODULE_ID} | Combat enregistré`, combatLogs[combat.id]);
}

function trackHpChange(actor, changes) {
  const combat = game.combat;
  if (!combat || !combatLogs[combat.id]) return;

  const hpChange = foundry.utils.getProperty(changes, "system.attributes.hp.value");
  if (hpChange === undefined) return;

  const log = combatLogs[combat.id];
  const entry = log.combatants[actor.id];
  if (!entry) return;

  const oldHp = getHp(actor).value;
  const newHp = Number(hpChange);
  const delta = newHp - oldHp;

  entry.endHp = newHp;

  if (delta < 0) {
    entry.damageTaken += Math.abs(delta);
  }

  if (delta > 0) {
    entry.healingReceived += delta;
  }

  if (oldHp > 0 && newHp <= 0) {
    entry.dropped = true;
  }
}

async function finishCombatLog(combat) {
  const log = combatLogs[combat.id];
  if (!log) return;

  log.endedAt = new Date().toLocaleString();
  log.rounds = combat.round ?? 0;

  const publicContent = buildPublicSummary(log);
  const gmContent = buildGmSummary(log);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: publicContent
  });

  const gmUsers = game.users.filter(u => u.isGM).map(u => u.id);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    whisper: gmUsers,
    content: gmContent,
    flags: {
      [MODULE_ID]: {
        combatLog: log
      }
    }
  });

  delete combatLogs[combat.id];
}

function buildPublicSummary(log) {
  const cards = Object.values(log.combatants)
    .map(c => `
      <div style="
        border: 1px solid #777;
        border-radius: 8px;
        padding: 8px;
        margin: 6px 0;
        background: rgba(0,0,0,0.08);
      ">
        <h3 style="margin: 0 0 4px 0;">${c.dropped ? "☠️ " : "🛡️ "}${c.name}</h3>

        <p style="margin: 2px 0;">
          <strong>PV finaux :</strong> ${c.endHp}/${c.maxHp}
        </p>

        <p style="margin: 2px 0;">
          <strong>Dégâts subis :</strong> ${c.damageTaken}
        </p>

        <p style="margin: 2px 0;">
          <strong>Soins reçus :</strong> ${c.healingReceived}
        </p>

        <p style="margin: 2px 0;">
          <strong>État :</strong> ${c.dropped ? "Tombé au moins une fois" : "Debout à la fin du combat"}
        </p>
      </div>
    `).join("");

  return `
    <h2>⚔️ Fin du combat</h2>
    <p><strong>Lieu :</strong> ${log.name}</p>
    <p><strong>Durée :</strong> ${log.rounds} round(s)</p>

    <hr>

    ${cards}
  `;
}

function buildGmSummary(log) {
  const publicSummary = buildPublicSummary(log);

  return `
    ${publicSummary}

    <hr>

    <p><strong>Version MJ :</strong> ce rapport peut être ajouté au journal de campagne.</p>

    <button type="button" data-action="lsa-add-journal" data-log-id="${log.id}">
      📜 Ajouter au journal
    </button>
  `;
}

async function appendCombatLogToJournal(log) {
  let journal = game.journal.find(j => j.name === JOURNAL_NAME);

  if (!journal) {
    journal = await JournalEntry.create({
      name: JOURNAL_NAME,
      pages: [
        {
          name: PAGE_NAME,
          type: "text",
          text: {
            content: `<h1>${JOURNAL_NAME}</h1>`
          }
        }
      ]
    });
  }

  let page = journal.pages.find(p => p.name === PAGE_NAME);

  if (!page) {
    page = await JournalEntryPage.create({
      name: PAGE_NAME,
      type: "text",
      text: {
        content: `<h1>${JOURNAL_NAME}</h1>`
      }
    }, { parent: journal });
  }

  const current = page.text.content ?? "";

  const addition = `
    <hr>
    <h2>⚔️ Combat - ${log.name}</h2>
    <p><strong>Début :</strong> ${log.startedAt}</p>
    <p><strong>Fin :</strong> ${log.endedAt}</p>
    <p><strong>Durée :</strong> ${log.rounds} round(s)</p>
    ${buildPublicSummary(log)}
  `;

  await page.update({
    "text.content": current + addition
  });
}

function getHp(actor) {
  return {
    value: Number(foundry.utils.getProperty(actor, "system.attributes.hp.value") ?? 0),
    max: Number(foundry.utils.getProperty(actor, "system.attributes.hp.max") ?? 0)
  };
}