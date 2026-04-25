import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";
import { GaiaExplorationService } from "./services/GaiaExplorationService.js";


Hooks.once("ready", () => {
  
  const generator = new GaiaGenerator();
  const service = new GaiaExplorationService(generator);

  service.openDialog = function () {
    new GaiaExplorationDialog().render(true);
  };
  
  game.gaiaExploration = service;

  ui.notifications.info("Gaïa Exploration Tools chargé.");
});

Hooks.on("renderChatMessage", (message, html, data) => {
  html.find(".gaia-reroll").click(ev => {
    const button = ev.currentTarget;

    const rollType = button.dataset.rollType;
    const biome = button.dataset.biome;

    game.gaiaExploration.rollByType(rollType, biome);
  });
});