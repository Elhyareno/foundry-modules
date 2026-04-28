const MODULE_ID = "event-forge";

export function registerEventForgeInMatCore() {
  if (!game.matcore?.registerModule) {
    console.warn(`${MODULE_ID} | MatCore non disponible, intégration ignorée.`);
    return;
  }

  game.matcore.registerModule(MODULE_ID, {
    label: "Event Forge",
    type: "Événements",
    icon: "fa-solid fa-wand-magic-sparkles",
    order: 30,

    getStatus: () => {
      return game.modules.get(MODULE_ID)?.active ? "active" : "inactive";
    },

    getData: () => {
      return {
        available: Boolean(globalThis.EventForge?.open),
        canCreateEvent: game.user.isGM
      };
    },

    actions: {
      openEventForge: async () => {
        if (!game.user.isGM) {
          ui.notifications.warn("Seul le MJ peut créer des événements.");
          return;
        }

        globalThis.EventForge?.open?.();
      }
    }
  });
}