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
        const biomeTrouve = trouverBiome(biome);
        if (!biomeTrouve) {
            await envoyerMessageChat(creerMessageBiomeInconnuHtml(biome));
            return null;
            }
        const curiosity = generator.generateCuriosity(biomeTrouve);
        const content = generator.formatCuriosity(curiosity, biomeTrouve);

      await envoyerMessageChat(content);
      return curiosity;
    },

    async rollResource(biome = "jungle"){
      const biomeTrouve = trouverBiome(biome);
      if (!biomeTrouve){
        await envoyerMessageChat(creerMessageBiomeInconnuHtml(biome));
        return null;
      }
      const resource = generator.generateResource(biomeTrouve);
      const content = generator.formatResource(resource, biomeTrouve);

      await envoyerMessageChat(content);
      return resource;
    }
  };
});