import { FCoreActors, FCoreChat, FCoreUI } from "../../lib-foundry-core/scripts/index.js";
import { PF2eRolls, PF2eSkills } from "../../lib-pf2e-tools/scripts/index.js";
import { escapeHtml, getD20, getSystemSkillChoices } from "./utils.js";

export function openQuickTestDialog() {
  if (!game.user.isGM) {
    FCoreUI.warn("Seul le MJ peut générer un test rapide.");
    return;
  }

  const sampleActor = FCoreActors.getControlledActor() ?? game.actors.find(actor => actor.type === "character");
  const skills = getSystemSkillChoices(sampleActor);

  const skillOptions = Object.entries(skills)
    .map(([slug, label]) => `<option value="${slug}">${escapeHtml(label)}</option>`)
    .join("");

  new Dialog({
    title: "Test rapide MJ",
    content: `
      <form class="pf2e-small-tools-form">
        <p class="notes">Génère un bouton de test dans le chat. Les joueurs sélectionnent leur token puis cliquent.</p>
        <div class="form-group">
          <label>Titre</label>
          <input type="text" name="title" value="Test rapide" />
        </div>
        <div class="form-group">
          <label>Compétence</label>
          <select name="skill">${skillOptions}</select>
        </div>
        <div class="form-group">
          <label>DD</label>
          <input type="number" name="dc" value="20" min="1" />
        </div>
        <div class="form-group">
          <label>Masquer le DD aux joueurs</label>
          <input type="checkbox" name="hideDc" checked />
        </div>
      </form>
    `,
    buttons: {
      post: {
        label: "Poster le test",
        icon: '<i class="fa-solid fa-dice-d20"></i>',
        callback: html => {
          const form = html[0].querySelector("form");
          const skill = form.skill.value;
          const skillLabel = skills[skill] ?? skill;

          postQuickTest({
            title: form.title.value || "Test rapide",
            skill,
            skillLabel,
            dc: Number(form.dc.value),
            hideDc: form.hideDc.checked
          });
        }
      },
      cancel: {
        label: "Annuler"
      }
    },
    default: "post"
  }).render(true);
}

async function postQuickTest({ title, skill, skillLabel, dc, hideDc }) {
  await FCoreChat.send(`
    <div class="pf2e-small-tools-card pf2e-small-tools-quick-test">
      <h3>${escapeHtml(title)}</h3>
      <p><strong>Compétence :</strong> ${escapeHtml(skillLabel)}</p>
      <p class="pf2e-small-tools-muted">${hideDc ? "DD caché" : `DD ${Number(dc)}`}</p>
      <button type="button"
        class="pf2e-small-tools-button pf2e-small-tools-quick-test-roll"
        data-title="${escapeHtml(title)}"
        data-skill="${escapeHtml(skill)}"
        data-skill-label="${escapeHtml(skillLabel)}"
        data-dc="${Number(dc)}"
        data-hide-dc="${hideDc ? "true" : "false"}">
        <i class="fa-solid fa-dice-d20"></i> Lancer le test
      </button>
    </div>
  `, { gmOnly: false });
}

export async function handleQuickTestRoll(button) {
  const actor = FCoreActors.getControlledActor();

  if (!actor) {
    FCoreUI.warn("Sélectionne d’abord ton personnage.");
    return;
  }

  const skill = button.dataset.skill;
  const skillLabel = button.dataset.skillLabel ?? skill;
  const dc = Number(button.dataset.dc);
  const title = button.dataset.title ?? "Test rapide";
  const hideDc = button.dataset.hideDc === "true";

  const skillData = PF2eSkills.get(actor, skill);
  if (!skillData) {
    FCoreUI.warn(`Compétence introuvable : ${skill}`);
    return;
  }

  const modifier = PF2eSkills.getModifier(actor, skill);
  const roll = await new Roll(`1d20 + ${modifier}`).evaluate();
  const d20 = getD20(roll);
  const total = roll.total;
  const degree = PF2eRolls.getDegreeOfSuccess(d20, total, dc);
  const resultLabel = PF2eRolls.getDegreeLabel(degree);

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `
      <div class="pf2e-small-tools-card">
        <h3>${escapeHtml(title)}</h3>
        <p><strong>${escapeHtml(actor.name)}</strong> tente ${escapeHtml(skillLabel)}.</p>
        <p>Résultat : ${total}${hideDc ? "" : ` contre DD ${dc}`}</p>
        <p><strong>${escapeHtml(resultLabel)}</strong></p>
      </div>
    `
  });

  if (hideDc) {
    await FCoreChat.send(`
      <div class="pf2e-small-tools-card">
        <h3>DD caché — ${escapeHtml(title)}</h3>
        <p><strong>Personnage :</strong> ${escapeHtml(actor.name)}</p>
        <p><strong>Compétence :</strong> ${escapeHtml(skillLabel)}</p>
        <p><strong>Résultat :</strong> ${total}</p>
        <p><strong>DD :</strong> ${dc}</p>
        <p><strong>Degré :</strong> ${escapeHtml(resultLabel)}</p>
      </div>
    `, { gmOnly: true, actor });
  }
}
