import {
  collectModuleStatus,
  collectHeroStats,
  collectVitalityActors
} from "./collectors.js";

export class MatCoreDashboard extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "matcore-system-dashboard",
      title: "MatCore System",
      template: "modules/matcore-system/templates/dashboard.hbs",
      width: 780,
      height: "auto",
      resizable: true,
      classes: ["matcore-system"]
    });
  }

  constructor(options = {}) {
    super(options);
    this.activeTab = "home";
  }

    async getData() {
    const registeredModules = await game.matcore.registry.collectAll();

    const modules = collectModuleStatus();
    const activeCount = modules.filter(module => module.active).length;

    return {
        activeTab: this.activeTab,
        modules,
        registeredModules,
        activeCount,
        totalCount: modules.length,
        heroStats: collectHeroStats(),
        vitalityActors: collectVitalityActors()
    };
    }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-tab]").on("click", event => {
      event.preventDefault();

      this.activeTab = event.currentTarget.dataset.tab;
      this.render();
    });

    html.find("[data-action='refresh']").on("click", event => {
      event.preventDefault();
      this.render();
    });

    html.find("[data-action='give-hero-point-party']").on("click", async event => {
      event.preventDefault();

      if (!game.heroStats?.giveOneHeroPointToParty) {
        ui.notifications.warn("Hero Stats n'est pas disponible.");
        return;
      }

      await game.heroStats.giveOneHeroPointToParty();
      this.render();
    });

    html.find("[data-action='reset-hero-stats']").on("click", async event => {
      event.preventDefault();

      if (!game.heroStats?.resetAll) {
        ui.notifications.warn("Hero Stats n'est pas disponible.");
        return;
      }

      await game.heroStats.resetAll();
      this.render();
    });
    html.find("button[data-module]").click(async ev => {
        const moduleId = ev.currentTarget.dataset.module;
        const actionId = ev.currentTarget.dataset.action;

        await game.matcore.runAction(moduleId, actionId);
    });    
  }
}