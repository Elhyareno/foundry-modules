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

    async rollFromGenerator(biome, generateFn, formatFn) {
      const biomeTrouve = trouverBiome(biome);

      if (!biomeTrouve) {
        await envoyerMessageChat(creerMessageBiomeInconnuHtml(biome));
        return null;
      }

      const result = generateFn(biomeTrouve);
      const content = formatFn(result, biomeTrouve);

      await envoyerMessageChat(content);
      return result;
    },

    async rollEvent(biome = "jungle") {
      return this.rollFromGenerator(
        biome,
        b => generator.generateEvent(b),
        (result, b) => generator.formatEvent(result, b)
      );
    },

    async rollCuriosity(biome = "jungle") {
      return this.rollFromGenerator(
        biome,
        b => generator.generateCuriosity(b),
        (result, b) => generator.formatCuriosity(result, b)
      );
    },

    async rollResource(biome = "jungle"){
      return this.rollFromGenerator(
        biome,
        b => generator.generateResource(b),
        (result, b) => generator.formatResource(result, b)
      );
    }
  };
});