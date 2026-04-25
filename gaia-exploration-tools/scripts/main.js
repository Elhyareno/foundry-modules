import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";
import { GaiaExplorationService } from "./services/GaiaExplorationService.js";
import { GaiaEntryDialog } from "./ui/GaiaEntryDialog.js";

Hooks.once("init", () => {
  game.settings.register("gaia-exploration-tools", "excludedEntries", {
    name: "Entrées exclues",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
  game.settings.register("gaia-exploration-tools", "customEntries", {
    name: "Entrées personnalisées",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
});

Hooks.once("ready", () => {
  const generator = new GaiaGenerator();
  const service = new GaiaExplorationService(generator);

  service.openDialog = function () {
    new GaiaExplorationDialog().render(true);
  };

  service.openEntryDialog = function () {
    new GaiaEntryDialog().render(true);
  };

  game.gaiaExploration = service;

  ui.notifications.info("Gaïa Exploration Tools chargé.");
});

Hooks.on("renderChatMessage", (message, html, data) => {
  html.find(".gaia-reroll").click(ev => {
    ev.preventDefault();
    ev.stopPropagation();
    const button = ev.currentTarget;

    const rollType = button.dataset.rollType;
    const biome = button.dataset.biome;
    const gmOnly = button.dataset.gmOnly === "true";

    game.gaiaExploration.rollByType(rollType, biome, gmOnly);
  });
});

Hooks.on("renderChatMessage", (message, html) => {
  html.find(".gaia-add-journal").click(async ev => {
    ev.preventDefault();
    ev.stopPropagation();

    const button = ev.currentTarget;

    const rollType = button.dataset.rollType;
    const biome = button.dataset.biome;
    const entryId = button.dataset.entryId;

    await game.gaiaExploration.addToJournal(rollType, biome, entryId);
  });
});

Hooks.on("renderChatMessage", (message, html) => {

  html.find(".gaia-remove-entry").click(async ev => {
    ev.preventDefault();
    ev.stopPropagation();

    const button = ev.currentTarget;

    const rollType = button.dataset.rollType;
    const biome = button.dataset.biome;
    const entryId = button.dataset.entryId;

    await game.gaiaExploration.excludeEntry(rollType, biome, entryId);
  });

});