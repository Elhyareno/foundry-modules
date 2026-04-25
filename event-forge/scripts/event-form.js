import { logEventCreation } from "./journal-log.js";

const DEFAULT_SKILLS = [
  { key: "acr", label: "Acrobatics" },
  { key: "arc", label: "Arcana" },
  { key: "ath", label: "Athletics" },
  { key: "cra", label: "Crafting" },
  { key: "dec", label: "Deception" },
  { key: "dip", label: "Diplomacy" },
  { key: "itm", label: "Intimidation" },
  { key: "med", label: "Medicine" },
  { key: "nat", label: "Nature" },
  { key: "occ", label: "Occultism" },
  { key: "prf", label: "Performance" },
  { key: "rel", label: "Religion" },
  { key: "soc", label: "Society" },
  { key: "ste", label: "Stealth" },
  { key: "sur", label: "Survival" },
  { key: "thi", label: "Thievery" }
];

const SF2E_EXTRA_SKILLS = [
  { key: "com", label: "Computers" },
  { key: "pil", label: "Piloting" }
];

function getAvailableSkills() {
  const actors = game.actors.filter(actor => actor.type === "character");

  const hasComputers = actors.some(actor => actor.system.skills?.com);
  const hasPiloting = actors.some(actor => actor.system.skills?.pil);

  const skills = [...DEFAULT_SKILLS];

  if (hasComputers) {
    skills.push({ key: "com", label: "Computers" });
  }

  if (hasPiloting) {
    skills.push({ key: "pil", label: "Piloting" });
  }

  return skills.sort((a, b) => a.label.localeCompare(b.label));
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