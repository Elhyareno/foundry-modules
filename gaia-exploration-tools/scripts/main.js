import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";
import { BIOMES } from "./data/biomes.js";

Hooks.once("ready", () => {
  ui.notifications.info("Gaïa Exploration Tools chargé.");

  const generator = new GaiaGenerator();

  game.gaiaExploration = {
    generator,
    listBiome(){
        const message=BIOMES;
        const content = "test";
        ChatMessage.create({
            message
        });
    },

    openDialog() {
      new GaiaExplorationDialog().render(true);
    },

    async rollEvent(biome = "jungle") {
      const event = generator.generateEvent(biome);
      const content = generator.formatEvent(event, biome);

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker(),
        content
      });

      return event;
    }
  };
});

Hooks.on("getSceneControlButtons", controls => {
  const tokenControls = controls.find(control => control.name === "token");

  if (!tokenControls) {
    return;
  }

  tokenControls.tools.push({
    name: "gaia-exploration",
    title: "Exploration de Gaïa",
    icon: "fas fa-seedling",
    button: true,
    onClick: () => {
      game.gaiaExploration.openDialog();
    }
  });
});