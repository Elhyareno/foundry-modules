const MODULE_ID = "pf2e-small-tools";

export function registerSmallToolsInMatCore() {
  if (!game.matcore?.registerModule) {
    console.warn(`${MODULE_ID} | MatCore non disponible, intégration ignorée.`);
    return false;
  }

  game.matcore.registerModule(MODULE_ID, {
    label: "PF2e Small Tools",
    type: "Outils PF2e / SF2e",
    icon: "fa-solid fa-toolbox",
    order: 45,

    getStatus: () => {
      return game.modules.get(MODULE_ID)?.active ? "active" : "inactive";
    },

    getData: () => {
      return {
        available: Boolean(game.pf2eSmallTools),
        canRepair: Boolean(game.pf2eSmallTools?.openRepairDialog),
        canCreateQuickTest: game.user.isGM && Boolean(game.pf2eSmallTools?.openQuickTestDialog)
      };
    },

    actions: {
      openRepairDialog: async () => {
        if (!game.pf2eSmallTools?.openRepairDialog) {
          ui.notifications.warn("PF2e Small Tools n’est pas disponible.");
          return;
        }

        game.pf2eSmallTools.openRepairDialog();
      },

      openQuickTestDialog: async () => {
        if (!game.user.isGM) {
          ui.notifications.warn("Seul le MJ peut générer un test rapide.");
          return;
        }

        if (!game.pf2eSmallTools?.openQuickTestDialog) {
          ui.notifications.warn("PF2e Small Tools n’est pas disponible.");
          return;
        }

        game.pf2eSmallTools.openQuickTestDialog();
      }
    }
  });

  return true;
}