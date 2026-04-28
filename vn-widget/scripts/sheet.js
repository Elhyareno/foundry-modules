import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor } from "./actor.js";

export function updatePanel(panel, actor) {
  const max = getVitalityMax(actor);
  const val = getVitalityValue(actor, max);

  panel.querySelector(".vn-value").textContent = val;
  panel.querySelector(".vn-max").textContent = max;
  panel.querySelector(".vn-amount-input").value = val;
}

function getTargetActor() {
  return Array.from(game.user.targets)[0]?.actor;
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

  pfsTabButton.innerHTML = `VN`;

  pfsPanel.innerHTML = `
    <div class="vn-widget">
      <h3>Vitality Network</h3>

      <div>
        <span class="vn-value">${value}</span> /
        <span class="vn-max">${max}</span>
      </div>

      <input class="vn-amount-input" type="number" min="0" max="${max}" value="${value}" />

      <button type="button" data-action="transfer">Transférer</button>
      <button type="button" data-action="refocus">Refocus</button>
      <button type="button" data-action="heal-max">Soin max</button>
    </div>
  `;

  if (pfsPanel.dataset.vnBound === "true") {
    updatePanel(pfsPanel, actor);
    return;
  }

  pfsPanel.dataset.vnBound = "true";

  pfsPanel.addEventListener("click", async event => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === "transfer") {
      const target = getTargetActor();
      if (!target) return ui.notifications.warn("Aucune cible sélectionnée.");

      const amount = Number(pfsPanel.querySelector(".vn-amount-input")?.value ?? 0);

      console.log("vn-widget | Demande transfert", {
        source: actor.name,
        target: target.name,
        amount
      });

      await game.vnWidget.transferVitalityToTarget(actor.id, target.id, amount);
      updatePanel(pfsPanel, actor);
    }

    if (action === "refocus") {
      await setVitality(actor, getVitalityMax(actor));
      updatePanel(pfsPanel, actor);
    }

    if (action === "heal-max") {
      const target = getTargetActor();
      if (!target) return ui.notifications.warn("Aucune cible sélectionnée.");

      console.log("vn-widget | Demande soin max", {
        source: actor.name,
        target: target.name
      });

      await game.vnWidget.transferVitalityToTarget(actor.id, target.id, null);
      updatePanel(pfsPanel, actor);
    }
  });

  pfsPanel.addEventListener("change", async event => {
    const input = event.target.closest(".vn-amount-input");
    if (!input) return;

    const maxNow = getVitalityMax(actor);
    const val = Math.max(0, Math.min(Number(input.value), maxNow));

    await setVitality(actor, val);
    updatePanel(pfsPanel, actor);
  });
}