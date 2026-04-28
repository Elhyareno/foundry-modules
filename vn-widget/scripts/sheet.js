import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { transferVitalityToTarget, transferMaxVitalityToTarget } from "./healing.js";
import { isVitalityActor } from "./actor.js";


export function updatePanel(panel, actor) {
  const max = getVitalityMax(actor);
  const val = getVitalityValue(actor, max);

  panel.querySelector(".vn-value").textContent = val;
  panel.querySelector(".vn-max").textContent = max;
  panel.querySelector(".vn-amount-input").value = val;
}


export async function renderVitalityWidget(app, html) {
  const actor = app.actor;
  if (!isVitalityActor(actor)) return;

  const root = html[0];

  const pfsTabButton = root.querySelector('a.item[data-tab="pfs"]');
  const pfsPanel = root.querySelector('section.tab[data-tab="pfs"]');

  if (!pfsTabButton || !pfsPanel) return;

  const max = getVitalityMax(actor);
  const value = getVitalityValue(actor, max);

  pfsTabButton.innerHTML = `<i class="fas fa-bolt"></i>`;

  pfsPanel.innerHTML = `
    <section class="vn-widget">
      <header class="vn-header">
        <h3>Vitality Network</h3>
        <div class="vn-total">
          <span class="vn-value">${value}</span> /
          <span class="vn-max">${max}</span>
        </div>
      </header>

      <div class="vn-controls">
        <input type="number" class="vn-amount-input" value="${value}" min="0" max="${max}"/>
      </div>

      <div class="vn-buttons">
        <button data-action="transfer">Transférer</button>
        <button data-action="refocus">Refocus</button>
        <button data-action="heal-max">Soin max</button>
      </div>
    </section>
  `;

  if (pfsPanel.dataset.vnBound === "true") {
    updatePanel(pfsPanel, actor);
    return;
  }

  pfsPanel.dataset.vnBound = "true";

  pfsPanel.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === "transfer") {
      const target = Array.from(game.user.targets)[0]?.actor;
      if (!target) return ui.notifications.warn("Aucune cible sélectionnée.");

      const amount = Number(pfsPanel.querySelector(".vn-amount-input")?.value ?? 0);
      await game.vnWidget.transferVitalityToTarget(actor.id, target.id, amount);
      updatePanel(pfsPanel, actor);
    }

    if (action === "refocus") {
      await setVitality(actor, getVitalityMax(actor));
      updatePanel(pfsPanel, actor);
    }

    if (action === "heal-max") {
      const target = Array.from(game.user.targets)[0]?.actor;
      if (!target) return ui.notifications.warn("Aucune cible sélectionnée.");

      await game.vnWidget.transferVitalityToTarget(actor.id, target.id, null);
      updatePanel(pfsPanel, actor);
    }
  });

  pfsPanel.addEventListener("change", async (event) => {
    const input = event.target.closest(".vn-amount-input");
    if (!input) return;

    const maxNow = getVitalityMax(actor);
    const val = Math.max(0, Math.min(Number(input.value), maxNow));

    await setVitality(actor, val);
    updatePanel(pfsPanel, actor);
  });
}