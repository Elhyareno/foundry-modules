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
        isGM: game.user.isGM,
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

      if (!game.user.isGM) return;

      if (!game.heroStats?.giveOneHeroPointToParty) {
        ui.notifications.warn("Hero Stats n'est pas disponible.");
        return;
      }

      await game.heroStats.giveOneHeroPointToParty();
      this.render();
    });

    html.find("[data-action='reset-hero-stats']").on("click", async event => {
      event.preventDefault();

      if (!game.user.isGM) return;

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

    html.find("[data-action='vn-recharge']").on("click", async event => {
    event.preventDefault();
    if (!game.user.isGM) return;

    const actorId = event.currentTarget.dataset.actorId;
    await game.vnWidget?.recharge?.(actorId);

    this.render();
    });

    html.find("[data-action='vn-empty']").on("click", async event => {
    event.preventDefault();
    if (!game.user.isGM) return;

    const actorId = event.currentTarget.dataset.actorId;
    await game.vnWidget?.empty?.(actorId);

    this.render();
    });

    html.find("[data-action='vn-transfer']").on("click", async event => {
    event.preventDefault();

    const sourceActorId = event.currentTarget.dataset.actorId;
    const source = game.actors.get(sourceActorId);

    if (!source?.testUserPermission(game.user, "OWNER")) {
        ui.notifications.warn("Tu ne contrôles pas ce Mystic.");
        return;
    }

    const target = Array.from(game.user.targets)[0]?.actor;

    if (!target) {
        ui.notifications.warn("Cible un token à soigner.");
        return;
    }

    const amount = await askVitalityTransferAmount(source, target);

    if (!amount) return;

    await game.vnWidget?.transferVitalityToTarget?.(source.id, target.id, amount);

    this.render();
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
          <section class="matcore-dialog-body">
            <header class="matcore-dialog-header">
              <h2>Transfer Vitality</h2>
              <p>Canalisation du réseau vital.</p>
            </header>

            <div class="matcore-dialog-card">
              <p>
                <strong>${source.name}</strong> peut transférer jusqu’à
                <strong>${maxAmount}</strong> point${maxAmount > 1 ? "s" : ""}.
              </p>

              <div class="matcore-dialog-stats">
                <div>
                  <span>Cible</span>
                  <strong>${target.name}</strong>
                </div>

                <div>
                  <span>PV manquants</span>
                  <strong>${missing}</strong>
                </div>

                <div>
                  <span>Vitality disponible</span>
                  <strong>${sourceData.value}</strong>
                </div>
              </div>

              <div class="form-group matcore-dialog-field">
                <label>Montant</label>
                <input
                  type="number"
                  name="amount"
                  min="1"
                  max="${maxAmount}"
                  value="${maxAmount}"
                />
              </div>
            </div>
          </section>
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