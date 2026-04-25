const MODULE_ID = "vn-widget";
const FLAG_SCOPE = "world";
const FLAG_KEY = "vitalityNetwork";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);
});

Hooks.on("renderActorSheet", async (app, html) => {
  const actor = app.actor;
  if (!actor) return;
  if (actor.type !== "character") return;

  const root = html[0];

  // =========================
  // HOOK BOUTON REPOS
  // =========================
  bindRestButton(root, actor);

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
      await transferVitalityToTarget(actor, pfsPanel);
      updatePanel(pfsPanel, actor);
    }

    if (action === "refocus") {
      await setVitality(actor, getVitalityMax(actor));
      updatePanel(pfsPanel, actor);
    }

    if (action === "heal-max") {
      await transferMaxVitalityToTarget(actor);
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
});

/* =========================
   COMBAT REGEN
========================= */

Hooks.on("combatRound", async (combat, data) => {
  if (!game.user.isGM) return;

  for (const c of combat.combatants) {
    const actor = c.actor;
    if (!actor) continue;

    const max = getVitalityMax(actor);
    const current = getVitalityValue(actor, max);
    const next = Math.min(current + 4, max);

    if (next === current) continue;
    await setVitality(actor, next);
  }
});

/* =========================
   REST LISTENER
========================= */

function bindRestButton(root, actor) {
  const selectors = [
    '[data-action="rest-for-the-night"]',
    '[data-action="rest"]',
    '.rest',
    'button.rest'
  ];

  const btn = root.querySelector(selectors.join(","));
  if (!btn) return;

  if (btn.dataset.vnBound === "true") return;
  btn.dataset.vnBound = "true";

  btn.addEventListener("click", () => {
    setTimeout(() => {
      rechargeVitalityOnRest(actor);
    }, 150);
  });
}

async function rechargeVitalityOnRest(actor) {
  const max = getVitalityMax(actor);
  await setVitality(actor, max);

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="vn-chat">
        <div class="vn-chat-title">🌙 Repos</div>
        <p>${actor.name} recharge entièrement son réseau.</p>
      </div>
    `
  });
}

/* =========================
   CORE LOGIC
========================= */

function getVitalityMax(actor) {
  return 6 + (getActorLevel(actor) * 4);
}

function getActorLevel(actor) {
  return Number(actor.system?.details?.level?.value ?? 1);
}

function getVitalityValue(actor, max = getVitalityMax(actor)) {
  const flag = actor.getFlag(FLAG_SCOPE, FLAG_KEY) ?? {};
  return Math.max(0, Math.min(Number(flag.value ?? 0), max));
}

async function setVitality(actor, value) {
  await actor.setFlag(FLAG_SCOPE, FLAG_KEY, { value });
}

function updatePanel(panel, actor) {
  const max = getVitalityMax(actor);
  const val = getVitalityValue(actor, max);

  panel.querySelector(".vn-value").textContent = val;
  panel.querySelector(".vn-max").textContent = max;
  panel.querySelector(".vn-amount-input").value = val;
}

/* =========================
   HEAL SYSTEM
========================= */

function getTarget() {
  return Array.from(game.user.targets)[0]?.actor;
}

function getHP(actor) {
  return actor.system.attributes.hp;
}

async function transferVitalityToTarget(source, panel) {
  const target = getTarget();
  if (!target) return;

  const hp = getHP(target);
  const missing = hp.max - hp.value;

  const max = getVitalityValue(source);
  const amount = Math.min(missing, max);

  const healed = Math.min(amount, missing);

  await target.update({ "system.attributes.hp.value": hp.value + healed });
  await setVitality(source, max - amount);
}

async function transferMaxVitalityToTarget(source) {
  const target = getTarget();
  if (!target) return;

  const hp = getHP(target);
  const missing = hp.max - hp.value;

  const vn = getVitalityValue(source);
  const heal = Math.min(vn, missing);

  await target.update({ "system.attributes.hp.value": hp.value + heal });
  await setVitality(source, vn - heal);
}