import { MODULE_ID } from "../constants.js";

export function registerSmallToolsInMatCore() {
  if (!game.matcore?.registerModule) {
    console.warn(`${MODULE_ID} | MatCore non disponible, intégration ignorée.`);
    return;
  }

  game.matcore.registerModule(MODULE_ID, {
    label: "PF2e Small Tools",
    type: "Outils",
    icon: "fa-solid fa-toolbox",
    order: 45,

    getStatus: () => {
      return game.modules.get(MODULE_ID)?.active ? "active" : "inactive";
    },

    getData: () => {
      return {
        available: Boolean(globalThis.PF2eSmallTools),
        canRepair: Boolean(globalThis.PF2eSmallTools?.openRepairDialog),
        canCreateQuickTest: game.user.isGM
      };
    },

    actions: {
      openRepairDialog: async () => {
        globalThis.PF2eSmallTools?.openRepairDialog?.();
      },
      openQuickTestDialog: async () => {
        if (!game.user.isGM) {
          ui.notifications.warn("Seul le MJ peut générer un test rapide.");
          return;
        }

        globalThis.PF2eSmallTools?.openQuickTestDialog?.();
      }
    }
  });
}
