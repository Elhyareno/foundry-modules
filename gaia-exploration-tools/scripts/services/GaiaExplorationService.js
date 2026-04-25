import { creerListeBiomesHtml, trouverBiome, creerMessageBiomeInconnuHtml } from "../utils/biomes.js";
import { envoyerMessageChat } from "../utils/chat.js";
import { createRollTypes } from "../config/rollTypes.js";

export class GaiaExplorationService {
    constructor(generator){
        this.generator = generator;
        this.rollTypes = createRollTypes(generator);
    }

    async listBiomes(){
        await envoyerMessageChat(creerListeBiomesHtml());
    }

    openDialog(DialogClass) {
    new DialogClass().render(true);
    }

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
    }

    async rollByType(type, biome = "jungle") {
      const config = this.rollTypes[type];

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

    async rollEvent(biome = "jungle") {
      return this.rollByType("event", biome);
    }

    async rollCuriosity(biome = "jungle") {
      return this.rollByType("curiosity", biome);
    }

    async rollResource(biome = "jungle") {
      return this.rollByType("resource", biome);
    }
  };