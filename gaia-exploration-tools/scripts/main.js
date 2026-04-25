import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";
import { creerListeBiomesHtml, trouverBiome, creerMessageBiomeInconnuHtml } from "./utils/biomes.js";
import { envoyerMessageChat } from "./utils/chat.js";
import { createRollTypes } from "./config/rollTypes.js";


Hooks.once("ready", () => {
  
  const generator = new GaiaGenerator();
  const rollTypes = createRollTypes(generator);
  
  game.gaiaExploration = service;

  openDialog() {
    new GaiaExplorationDialog().render(true);
  }

  ui.notifications.info("Gaïa Exploration Tools chargé.");
});