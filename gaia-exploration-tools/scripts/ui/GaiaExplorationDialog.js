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
      biomes: BIOMES,
    };
  }

  async _updateObject(event, formData) {
    const biome = formData.biome ?? "jungle";
    const rollType = formData.rollType ?? "event";
    if (rollType === "event") {
        await game.gaiaExploration.rollEvent(biome);
    } else if(rollType === "curiosity"){
        await game.gaiaExploration.rollCuriosity(biome);
    } else {
        await game.gaiaExploration.rollResource(biome);
    }
  }
}