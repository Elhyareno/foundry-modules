import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";
import { BIOMES } from "./data/biomes.js";
import { creerListeBiomesHtml, trouverBiome, creerMessageBiomeInconnuHtml } from "./utils/biomes.js";
import { envoyerMessageChat } from "./utils/chat.js";

Hooks.once("ready", () => {
  ui.notifications.info("Gaïa Exploration Tools chargé.");

  const generator = new GaiaGenerator();

  game.gaiaExploration = {
    generator,

    async listBiomes(){
        await envoyerMessageChat(creerListeBiomesHtml());
    },

    openDialog() {
      new GaiaExplorationDialog().render(true);
    },

    async rollEvent(biome = "jungle") {
        const biomeTrouve = trouverBiome(biome);
        if (!biomeTrouve) {
            await envoyerMessageChat(creerMessageBiomeInconnuHtml(biome));
            return null;
            }
        const event = generator.generateEvent(biomeTrouve);
        const content = generator.formatEvent(event, biomeTrouve);

      await envoyerMessageChat(content);
      return event;
    },

    async rollCuriosity(biome = "jungle") {
        const biomeTrouve = trouverBiome(biome);
        if (!biomeTrouve) {
            await envoyerMessageChat(creerMessageBiomeInconnuHtml(biome));
            return null;
            }
        const curiosity = generator.generateCuriosity(biomeTrouve);
        const content = generator.formatCuriosity(curiosity, biomeTrouve);

      await envoyerMessageChat(content);
      return curiosity;
    }
  };
});