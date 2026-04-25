import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";
import { GaiaExplorationService } from "./services/GaiaExplorationService.js";


Hooks.once("ready", () => {
  
  const generator = new GaiaGenerator();
  const service = new GaiaExplorationService(generator);
  const rollTypes = createRollTypes(generator);

  service.openDialog = function () {
    new GaiaExplorationDialog().render(true);
  };
  
  game.gaiaExploration = service;

  ui.notifications.info("Gaïa Exploration Tools chargé.");
});