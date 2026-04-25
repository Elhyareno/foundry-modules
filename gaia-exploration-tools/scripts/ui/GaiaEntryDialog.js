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
    console.log(formData);
    ui.notifications.info("Formulaire reçu.");
  }
}