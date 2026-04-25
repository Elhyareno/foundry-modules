import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";
import { creerListeBiomesHtml, trouverBiome, creerMessageBiomeInconnuHtml } from "./utils/biomes.js";
import { envoyerMessageChat } from "./utils/chat.js";



Hooks.once("ready", () => {
  ui.notifications.info("Gaïa Exploration Tools chargé.");

  const generator = new GaiaGenerator();
  
  const rollTypes = {
    event: {
      generate: b => generator.generateEvent(b),
      format: (result, b) => generator.formatEvent(result, b)
    },
    curiosity: {
      generate: b => generator.generateCuriosity(b),
      format: (result, b) => generator.formatCuriosity(result, b)
    },
    resource: {
      generate: b => generator.generateResource(b),
      format: (result, b) => generator.formatResource(result, b)
    }
  };

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

    async rollByType(type, biome = "jungle") {
      const config = rollTypes[type];

      if (!config) {
        ui.notifications.warn(`Type de tirage inconnu : ${type}`);
        return null;
      }

      return this.rollFromGenerator(
        biome,
        config.generate,
        config.format
      );
    }
  };
});