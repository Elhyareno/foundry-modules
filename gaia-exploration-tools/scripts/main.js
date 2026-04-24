import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";
import { BIOMES } from "./data/biomes.js";
import { creerListeBiomesHtml, trouverBiome, creerMessageBiomeInconnuHtml } from "./utils/biomes.js";

Hooks.once("ready", () => {
  ui.notifications.info("Gaïa Exploration Tools chargé.");

  const generator = new GaiaGenerator();

  game.gaiaExploration = {
    generator,

    listBiomes(){
        ChatMessage.create({
            content: creerListeBiomesHtml()
        });
    },

    openDialog() {
      new GaiaExplorationDialog().render(true);
    },

    async rollEvent(biome = "jungle") {
        const biomeTrouve = trouverBiome(biome);
        if (!biomeTrouve) {
            const content = creerMessageBiomeInconnuHtml(biome);
            ChatMessage.create({
                content
            });
            return null;
            }
        const event = generator.generateEvent(biomeTrouve);
        const content = generator.formatEvent(event, biomeTrouve);

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