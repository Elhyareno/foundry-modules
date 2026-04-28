import { BIOMES } from "../data/biomes.js";

const TYPE_LABELS = {
  event: "Événement",
  curiosity: "Curiosité",
  resource: "Ressource"
};

export class GaiaEntryPickerDialog extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gaia-entry-picker-dialog",
      title: "Lancer une entrée de Gaïa",
      template: "modules/gaia-exploration-tools/templates/gaia-entry-picker-dialog.hbs",
      width: 650,
      height: "auto",
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false
    });
  }

  getData() {
    const entries = game.gaiaExploration.getAllEntriesForPicker();

    return {
      biomes: BIOMES,
      entries,
      types: [
        { value: "event", label: TYPE_LABELS.event },
        { value: "curiosity", label: TYPE_LABELS.curiosity },
        { value: "resource", label: TYPE_LABELS.resource }
      ]
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[name='type'], [name='biome']").on("change", () => {
      this.render(false);
    });
  }

  async _updateObject(event, formData) {
    const entryKey = formData.entryKey;
    const gmOnly = Boolean(formData.gmOnly);

    if (!entryKey) {
      ui.notifications.warn("Aucune entrée sélectionnée.");
      return;
    }

    await game.gaiaExploration.launchEntryByKey(entryKey, gmOnly);
  }
}