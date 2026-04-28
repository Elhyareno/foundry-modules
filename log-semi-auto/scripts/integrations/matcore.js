const MODULE_ID = "log-semi-auto";

export function registerLogSemiAutoInMatCore() {
  if (!game.matcore?.registerModule) {
    console.warn(`${MODULE_ID} | MatCore non disponible, intégration ignorée.`);
    return;
  }

  game.matcore.registerModule(MODULE_ID, {
    label: "Combat Log",
    type: "Archives de combat",
    icon: "fa-solid fa-scroll",
    order: 40,

    getStatus: () => {
      return game.modules.get(MODULE_ID)?.active ? "active" : "inactive";
    },

    getData: () => {
      const journalName = game.settings.get(MODULE_ID, "journalName");
      const journal = game.journal.find(j => j.name === journalName);

      return {
        journalName,
        journalId: journal?.id ?? null,
        journalExists: Boolean(journal),
        canOpenJournal: Boolean(journal),
        canConfigure: game.user.isGM
      };
    },

    actions: {
      openCombatJournal: async () => {
        const journalName = game.settings.get(MODULE_ID, "journalName");
        const journal = game.journal.find(j => j.name === journalName);

        if (!journal) {
          ui.notifications.warn(`Journal introuvable : ${journalName}`);
          return;
        }

        journal.sheet.render(true);
      },

      openSettings: async () => {
        if (!game.user.isGM) {
          ui.notifications.warn("Seul le MJ peut modifier les réglages du module.");
          return;
        }

        game.settings.sheet.render(true);
      }
    }
  });
}