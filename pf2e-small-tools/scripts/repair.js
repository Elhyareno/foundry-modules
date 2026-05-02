import { FCoreActors, FCoreChat, FCoreUI } from "../../lib-foundry-core/scripts/index.js";
import { PF2eRolls, PF2eSkills } from "../../lib-pf2e-tools/scripts/index.js";
import { getItemHpData, getRepairableItems } from "./items.js";
import { requestItemHpUpdate } from "./socket.js";
import {
  escapeHtml,
  getD20,
  getItemLevel,
  getLevelBasedDC,
  getRepairAmountForCraftRank,
  getSkillRank
} from "./utils.js";

export function openRepairDialog() {
  const actor = FCoreActors.getControlledActor();

  if (!actor) {
    FCoreUI.warn("Sélectionne d’abord le personnage propriétaire de l’objet.");
    return;
  }

  let items = getRepairableItems(actor, { damagedOnly: true });

  if (!items.length) {
    items = getRepairableItems(actor, { damagedOnly: false });
  }

  if (!items.length) {
    FCoreUI.warn("Aucun objet avec PV exploitable trouvé dans cet inventaire.");
    return;
  }

  const options = items.map(item => {
    const hp = getItemHpData(item);
    const label = `${item.name} — ${hp.value}/${hp.max} PV`;
    return `<option value="${item.id}">${escapeHtml(label)}</option>`;
  }).join("");

  const firstItem = items[0];
  const defaultDc = getLevelBasedDC(getItemLevel(firstItem));

  new Dialog({
    title: "Demander une réparation",
    content: `
      <form class="pf2e-small-tools-form">
        <p class="notes">Choisis l’objet à présenter au réparateur. Le jet sera lancé par la personne qui cliquera ensuite dans le chat.</p>
        <div class="form-group">
          <label>Objet</label>
          <select name="itemId">${options}</select>
        </div>
        <div class="form-group">
          <label>DD</label>
          <input type="number" name="dc" value="${defaultDc}" min="1" />
        </div>
        <div class="form-group">
          <label>Note</label>
          <input type="text" name="note" placeholder="ex : bouclier cabossé après le combat" />
        </div>
      </form>
    `,
    buttons: {
      post: {
        label: "Poster la demande",
        icon: '<i class="fa-solid fa-hammer"></i>',
        callback: html => {
          const form = html[0].querySelector("form");
          const itemId = form.itemId.value;
          const dc = Number(form.dc.value);
          const note = form.note.value;

          postRepairRequest({ actor, itemId, dc, note });
        }
      },
      cancel: {
        label: "Annuler"
      }
    },
    default: "post"
  }).render(true);
}

async function postRepairRequest({ actor, itemId, dc, note }) {
  const item = actor.items.get(itemId);
  const hp = getItemHpData(item);

  if (!item || !hp) {
    FCoreUI.warn("Objet introuvable ou non réparable.");
    return;
  }

  await FCoreChat.send(`
    <div class="pf2e-small-tools-card pf2e-small-tools-repair-request">
      <h3>Demande de réparation</h3>
      <p><strong>${escapeHtml(actor.name)}</strong> présente <strong>${escapeHtml(item.name)}</strong>.</p>
      <p class="pf2e-small-tools-muted">État : ${hp.value} / ${hp.max} PV · DD ${Number(dc)}</p>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
      <button type="button"
        class="pf2e-small-tools-button pf2e-small-tools-repair-roll"
        data-owner-actor-id="${actor.id}"
        data-item-id="${item.id}"
        data-dc="${Number(dc)}">
        <i class="fa-solid fa-screwdriver-wrench"></i> Réparer avec Artisanat
      </button>
    </div>
  `, { actor });
}

export async function handleRepairRoll(button) {
  const repairer = FCoreActors.getControlledActor();

  if (!repairer) {
    FCoreUI.warn("Sélectionne le personnage qui effectue la réparation.");
    return;
  }

  const ownerActorId = button.dataset.ownerActorId;
  const itemId = button.dataset.itemId;
  const dc = Number(button.dataset.dc);

  const owner = game.actors.get(ownerActorId);
  const item = owner?.items?.get(itemId);

  if (!owner || !item) {
    FCoreUI.warn("L’objet à réparer est introuvable.");
    return;
  }

  const modifier = PF2eSkills.getModifier(repairer, "cra");
  const roll = await new Roll(`1d20 + ${modifier}`).evaluate();
  const d20 = getD20(roll);
  const total = roll.total;
  const degree = PF2eRolls.getDegreeOfSuccess(d20, total, dc);
  const resultLabel = PF2eRolls.getDegreeLabel(degree);
  const craftRank = getSkillRank(repairer, "cra");
  const baseRepair = getRepairAmountForCraftRank(craftRank);

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: repairer }),
    flavor: `
      <div class="pf2e-small-tools-card">
        <h3>Réparation : ${escapeHtml(item.name)}</h3>
        <p><strong>${escapeHtml(repairer.name)}</strong> utilise Artisanat.</p>
        <p>Résultat : ${total} contre DD ${dc}</p>
        <p><strong>${escapeHtml(resultLabel)}</strong></p>
      </div>
    `
  });

  if (degree === "criticalSuccess" || degree === "success") {
    const amount = degree === "criticalSuccess" ? baseRepair * 2 : baseRepair;

    if (amount <= 0) {
      FCoreUI.warn("Le réparateur n’est pas qualifié en Artisanat : aucune réparation appliquée.");
      return;
    }

    await requestItemHpUpdate({
      actorId: owner.id,
      itemId: item.id,
      mode: "heal",
      amount,
      reason: `${repairer.name} — ${resultLabel}`
    });

    return;
  }

  if (degree === "criticalFailure") {
    const damageRoll = await new Roll("2d6").evaluate();
    await damageRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: repairer }),
      flavor: `Dégâts infligés à l’objet lors d’un échec critique de réparation.`
    });

    await requestItemHpUpdate({
      actorId: owner.id,
      itemId: item.id,
      mode: "damage",
      amount: damageRoll.total,
      reason: `${repairer.name} — ${resultLabel}`
    });
  }
}
