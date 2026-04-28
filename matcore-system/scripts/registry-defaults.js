export function registerCoreModules() {
  registerModuleStatus("lib-foundry-core", "Lib Foundry Core", "Librairie", 10);
  registerModuleStatus("lib-pf2e-tools", "Lib PF2e Tools", "Librairie", 20);
  registerModuleStatus("event-forge", "Event Forge", "Module", 30);
  registerModuleStatus("log-semi-auto", "Log Semi Auto", "Module", 40);
  registerModuleStatus("vn-widget", "Vitality Network Widget", "Module", 50);
  registerModuleStatus("gaia-exploration-tools", "Gaïa Exploration Tools", "Module", 60);

  game.matcore.registerModule("pf2e-hero-stats", {
    label: "PF2e/SF2e Hero Stats",
    type: "Module",
    icon: "fa-solid fa-dice-d20",
    order: 45,

    getStatus: () => {
      const mod = game.modules.get("pf2e-hero-stats");
      if (!mod?.active) return "inactive";
      if (!game.heroStats) return "partial";
      return "active";
    },

    getData: () => {
      if (!game.heroStats) return {};

      return {
        stats: game.heroStats.getStats?.() ?? {},
        hero: game.heroStats.getHeroSummary?.() ?? {}
      };
    },

    actions: {
      givePartyHeroPoint: async () => game.heroStats?.giveOneHeroPointToParty?.(),
      resetAll: async () => game.heroStats?.resetAll?.()
    }
  });
}

function registerModuleStatus(id, label, type, order) {
  game.matcore.registerModule(id, {
    label,
    type,
    order,
    getStatus: () => {
      const mod = game.modules.get(id);
      if (!mod) return "missing";
      return mod.active ? "active" : "inactive";
    },
    getData: () => {
      const mod = game.modules.get(id);
      return {
        installed: Boolean(mod),
        active: Boolean(mod?.active),
        version: mod?.version ?? "—"
      };
    }
  });
}