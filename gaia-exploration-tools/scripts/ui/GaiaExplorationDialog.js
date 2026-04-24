import { BIOMES } from "../data/biomes.js";

export class GaiaExplorationDialog extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gaia-exploration-dialog",
      title: "Exploration de Gaïa",
      template: "modules/gaia-exploration-tools/templates/gaia-exploration-dialog.hbs",
      width: 420,
      height: "auto",
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false
    });
  }

  getData() {
    return {
      biomes: BIOMES
    };
  }

  async _updateObject(event, formData) {
    const biome = formData.biome ?? "jungle";

    const generator = game.gaiaExploration?.generator;

    if (!generator) {
      ui.notifications.error("Gaïa Exploration Tools n'est pas prêt.");
      return;
    }

    const generatedEvent = generator.generateEvent(biome);
    const content = generator.formatEvent(generatedEvent, biome);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content
    });
  }
}