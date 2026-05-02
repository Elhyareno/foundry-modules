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
    this.selectedCombatLogPageId = null;
  }

  async getData() {
    const registeredModules = await game.matcore.registry.collectAll();

    const gaiaModule = registeredModules.find(module => module.id === "gaia-exploration-tools");
    const eventForgeModule = registeredModules.find(module => module.id === "event-forge");
    const combatLogModule = registeredModules.find(module => module.id === "log-semi-auto");
    const smallToolsModule = registeredModules.find(module => module.id === "pf2e-small-tools");

    const combatLog = combatLogModule?.data ?? { available: false };
    const combatPages = combatLog.pages ?? [];

    if (!this.selectedCombatLogPageId && combatPages.length) {
      this.selectedCombatLogPageId = combatPages[0].id;
    }

    const selectedCombatLogPage =
      combatPages.find(page => page.id === this.selectedCombatLogPageId) ??
      combatPages[0] ??
      null;

    const modules = collectModuleStatus();
    const activeCount = modules.filter(module => module.active).length;

    return {
      isGM: game.user.isGM,
      activeTab: this.activeTab,
      modules,
      registeredModules,
      activeCount,
      totalCount: modules.length,
      heroStats: collectHeroStats(),
      vitalityActors: collectVitalityActors(),
      gaia: gaiaModule?.data ?? { available: false },
      eventForge: eventForgeModule?.data ?? { available: false },
      combatLog: combatLog,
      selectedCombatLogPage,
      smallTools: smallToolsModule?.data ?? { available: false }
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-tab]").on("click", event => {
      event.preventDefault();
      this.activeTab = event.currentTarget.dataset.tab;
      this.render(false);
    });

    html.find("[data-action='refresh']").on("click", event => {
      event.preventDefault();
      this.render(false);
    });

    html.find("[data-action='give-hero-point-party']").on("click", async event => {
      event.preventDefault();

      if (!game.user.isGM) return;

      if (!game.heroStats?.giveOneHeroPointToParty) {
        ui.notifications.warn("Hero Stats n'est pas disponible.");
        return;
      }

      await game.heroStats.giveOneHeroPointToParty();
      this.render(false);
    });

    html.find("[data-action='reset-hero-stats']").on("click", async event => {
      event.preventDefault();

      if (!game.user.isGM) return;

      if (!game.heroStats?.resetAll) {
        ui.notifications.warn("Hero Stats n'est pas disponible.");
        return;
      }

      await game.heroStats.resetAll();
      this.render(false);
    });

    html.find("button[data-module]").on("click", async event => {
      event.preventDefault();

      const moduleId = event.currentTarget.dataset.module;
      const actionId = event.currentTarget.dataset.action;

      await game.matcore.runAction(moduleId, actionId);
    });

    html.find("[data-action='vn-recharge']").on("click", async event => {
      event.preventDefault();

      if (!game.user.isGM) return;

      const actorId = event.currentTarget.dataset.actorId;
      await game.vnWidget?.recharge?.(actorId);

      this.render(false);
    });

    html.find("[data-action='vn-empty']").on("click", async event => {
      event.preventDefault();

      if (!game.user.isGM) return;

      const actorId = event.currentTarget.dataset.actorId;
      await game.vnWidget?.empty?.(actorId);

      this.render(false);
    });

    html.find("[data-action='vn-transfer']").on("click", async event => {
      event.preventDefault();

      if (!game.vnWidget?.transferVitalityToTarget) {
        ui.notifications.warn("VN Widget n'est pas disponible.");
        return;
      }

      const sourceActorId = event.currentTarget.dataset.actorId;
      const source = game.actors.get(sourceActorId);

      if (!source) {
        ui.notifications.warn("Mystic introuvable.");
        return;
      }

      if (!source.testUserPermission(game.user, "OWNER")) {
        ui.notifications.warn("Tu ne contrôles pas ce Mystic.");
        return;
      }

      const targetToken = Array.from(game.user.targets)[0];
      const target = targetToken?.actor;

      if (!targetToken || !target) {
        ui.notifications.warn("Cible un token à soigner.");
        return;
      }

      const amount = await askVitalityTransferAmount(source, target);
      if (!amount || amount <= 0) return;

      await game.vnWidget.transferVitalityToTarget(
        source.uuid,
        targetToken.document.uuid,
        amount
      );

      ui.notifications.info(`Transfert de ${amount} point${amount > 1 ? "s" : ""} de Vitality Network effectué.`);
      this.render(false);
    });

    html.find("[data-action='select-combat-log-page']").on("change", event => {
      event.preventDefault();

      this.selectedCombatLogPageId = event.currentTarget.value;
      this.render(false);
    });    
  }
}

async function askVitalityTransferAmount(source, target) {
  const sourceData = game.vnWidget.getVitalityData(source);
  const hp = target.system?.attributes?.hp;

  if (!hp) {
    ui.notifications.warn("La cible n’a pas de PV valides.");
    return null;
  }

  const missing = Math.max(0, Number(hp.max ?? 0) - Number(hp.value ?? 0));
  const maxAmount = Math.min(sourceData.value, missing);

  if (maxAmount <= 0) {
    ui.notifications.warn("Aucun transfert possible.");
    return null;
  }

  return new Promise(resolve => {
    new Dialog(
      {
        title: "Transfer Vitality",
        content: `
          <form class="matcore-vn-transfer-form">
            <div class="matcore-vn-transfer-summary">
              <p><strong>${source.name}</strong> peut transférer jusqu’à <strong>${maxAmount}</strong> point${maxAmount > 1 ? "s" : ""}.</p>
              <p><strong>Cible :</strong> ${target.name}</p>
              <p><strong>PV manquants :</strong> ${missing}</p>
              <p><strong>Vitality disponible :</strong> ${sourceData.value}</p>
            </div>

            <div class="form-group">
              <label>Montant</label>
              <input type="number" name="amount" min="1" max="${maxAmount}" value="${maxAmount}" style="color: #f4f7ff; -webkit-text-fill-color: #f4f7ff; background-color: #0b1220; border: 1px solid #6f7d99; caret-color: #ffffff;" />
            </div>
          </form>
        `,
        buttons: {
          confirm: {
            label: "Transférer",
            callback: html => {
              const root = html instanceof HTMLElement ? html : html[0];
              const input = root.querySelector("input[name='amount']");
              const raw = Number(input?.value ?? 0);

              if (!Number.isFinite(raw) || raw <= 0) {
                resolve(null);
                return;
              }

              resolve(Math.max(1, Math.min(Math.floor(raw), maxAmount)));
            }
          },
          cancel: {
            label: "Annuler",
            callback: () => resolve(null)
          }
        },
        default: "confirm",
        close: () => resolve(null)
      },
      {
        classes: ["matcore-dialog-window"]
      }
    ).render(true);
  });
}