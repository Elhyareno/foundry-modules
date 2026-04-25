import { BIOMES } from "../data/biomes.js";

export class GaiaEntryDialog extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gaia-entry-dialog",
      title: "Ajouter une entrée d'exploration",
      template: "modules/gaia-exploration-tools/templates/gaia-entry-dialog.hbs",
      width: 500,
      height: "auto",
      closeOnSubmit: true
    });
  }

  getData() {
    return {
      biomes: BIOMES
    };
  }

  async _updateObject(event, formData) {
    const type = formData.type;
    const biome = formData.biome;
    const title = formData.title;
    const description = formData.description;
    const score = Number(formData.score);
    const tags = (formData.tags ?? "")
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    const entry = {
      id: `${type}-${biome}-${Date.now()}`,
      title,
      description,
      tags
    };

    if (type === "event") {
      entry.danger = score;
    }

    if (type === "resource") {
      entry.value = score;
    }

    await game.gaiaExploration.addCustomEntry(type, biome, entry);
  }
}