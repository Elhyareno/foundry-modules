import { logEventCreation } from "./journal-log.js";

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
      skills: [
        { key: "acrobatics", label: "Acrobaties" },
        { key: "arcana", label: "Arcanes" },
        { key: "athletics", label: "Athlétisme" },
        { key: "crafting", label: "Artisanat" },
        { key: "deception", label: "Duperie" },
        { key: "diplomacy", label: "Diplomatie" },
        { key: "intimidation", label: "Intimidation" },
        { key: "medicine", label: "Médecine" },
        { key: "nature", label: "Nature" },
        { key: "occultism", label: "Occultisme" },
        { key: "performance", label: "Représentation" },
        { key: "religion", label: "Religion" },
        { key: "society", label: "Société" },
        { key: "stealth", label: "Discrétion" },
        { key: "survival", label: "Survie" },
        { key: "thievery", label: "Vol" }
      ]
    };
  }

  async _updateObject(event, formData) {
    const eventId = foundry.utils.randomID();

    const title = formData.title;
    const skill = formData.skill;
    const skillLabel = this.getData().skills.find(s => s.key === skill)?.label ?? skill;
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
          data-title="${title}"
          data-skill="${skill}"
          data-dc="${dc}">
          Faire le test
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