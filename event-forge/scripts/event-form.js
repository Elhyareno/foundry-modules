import { logEventCreation } from "./journal-log.js";

const FALLBACK_SKILLS = [
  { key: "acrobatics", label: "Acrobatics" },
  { key: "arcana", label: "Arcana" },
  { key: "athletics", label: "Athletics" },
  { key: "crafting", label: "Crafting" },
  { key: "deception", label: "Deception" },
  { key: "diplomacy", label: "Diplomacy" },
  { key: "intimidation", label: "Intimidation" },
  { key: "medicine", label: "Medicine" },
  { key: "nature", label: "Nature" },
  { key: "occultism", label: "Occultism" },
  { key: "performance", label: "Performance" },
  { key: "religion", label: "Religion" },
  { key: "society", label: "Society" },
  { key: "stealth", label: "Stealth" },
  { key: "survival", label: "Survival" },
  { key: "thievery", label: "Thievery" }
];

function getAvailableSkills() {
  const actor =
    canvas.tokens.controlled[0]?.actor ??
    game.actors.find(a => a.type === "character" && a.system?.skills);

  const skills = actor?.system?.skills;

  if (!skills) {
    return FALLBACK_SKILLS;
  }

  return Object.entries(skills)
    .filter(([key, skill]) => !skill.lore)
    .map(([key, skill]) => ({
      key,
      label: skill.label ?? skill.slug ?? key
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}


export class EventForgeForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "event-forge-form",
      title: "Créer un événement",
      template: "modules/event-forge/templates/event-form.hbs",
      width: 520,
      height: "auto",
      closeOnSubmit: true
    });
  }

  getData() {
    return {
      skills: getAvailableSkills()
    };
  }

  async _updateObject(event, formData) {
    const eventId = foundry.utils.randomID();

    const title = formData.title;
    const skill = formData.skill;
    const skills = getAvailableSkills();
    const skillLabel = skills.find(s => s.key === skill)?.label ?? skill;
    const dc = Number(formData.dc);
    const fluff = formData.fluff;
    const success = formData.success;
    const failure = formData.failure;

    const content = `
      <div class="event-forge-card" data-event-id="${eventId}">
        <h2>${title}</h2>
        <p class="event-forge-fluff">${fluff}</p>

        <p><strong>Test demandé :</strong> ${skillLabel} DD ${dc}</p>

        <button
          class="event-forge-roll"
          data-event-id="${eventId}"
          data-title="${foundry.utils.escapeHTML(title)}"
          data-skill="${skill}"
          data-dc="${dc}"
          data-success="${foundry.utils.escapeHTML(success)}"
          data-failure="${foundry.utils.escapeHTML(failure)}">
          Lancer le test
        </button>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content,
      flags: {
        "event-forge": {
          eventId,
          title,
          skill,
          skillLabel,
          dc,
          fluff,
          success,
          failure,
          results: []
        }
      }
    });

    await logEventCreation({
      eventId,
      title,
      skillLabel,
      dc,
      fluff,
      success,
      failure
    });
  }
}