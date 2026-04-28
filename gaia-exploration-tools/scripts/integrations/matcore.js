const MODULE_ID = "gaia-exploration-tools";

export function registerGaiaInMatCore() {
  if (!game.matcore?.registerModule) {
    console.warn(`${MODULE_ID} | MatCore non disponible, intégration ignorée.`);
    return;
  }

  game.matcore.registerModule(MODULE_ID, {
    label: "Gaïa Exploration",
    type: "Exploration",
    icon: "fa-solid fa-seedling",
    order: 40,

    getStatus: () => {
      return game.modules.get(MODULE_ID)?.active ? "active" : "inactive";
    },

    getData: () => {
      const service = game.gaiaExploration;

      if (!service) {
        return {
          available: false
        };
      }

      const entries = service.getAllEntriesForPicker?.() ?? [];
      const customEntries = game.settings.get(MODULE_ID, "customEntries") ?? {};
      const excludedEntries = game.settings.get(MODULE_ID, "excludedEntries") ?? {};

      return {
        available: true,
        totalEntries: entries.length,
        customEntriesCount: countNestedEntries(customEntries),
        excludedEntriesCount: countNestedEntries(excludedEntries)
      };
    },

    actions: {
      openRollDialog: async () => {
        game.gaiaExploration?.openDialog?.();
      },

      openEntryDialog: async () => {
        game.gaiaExploration?.openEntryDialog?.();
      },

      openEntryPickerDialog: async () => {
        game.gaiaExploration?.openEntryPickerDialog?.();
      },

      listBiomes: async () => {
        await game.gaiaExploration?.listBiomes?.();
      }
    }
  });
}

function countNestedEntries(root) {
  let count = 0;

  for (const typeData of Object.values(root ?? {})) {
    for (const biomeEntries of Object.values(typeData ?? {})) {
      if (Array.isArray(biomeEntries)) {
        count += biomeEntries.length;
      }
    }
  }

  return count;
}