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

    async rollFromGenerator(biome, generateFn, formatFn, gmOnly = false) {
      const biomeTrouve = trouverBiome(biome);

      if (!biomeTrouve) {
        await envoyerMessageChat(creerMessageBiomeInconnuHtml(biome), gmOnly);
        return null;
      }

      const result = generateFn(biomeTrouve);
      const content = formatFn(result, biomeTrouve);

      await envoyerMessageChat(content, gmOnly);
      return result;
    }

    async rollByType(type, biome = "jungle", gmOnly = false) {
      const config = this.rollTypes[type];

      if (!config) {
        ui.notifications.warn(`Type de tirage inconnu : ${type}`);
        return null;
      }

      return this.rollFromGenerator(
        biome,
        config.generate,
        config.format,
        gmOnly
      );
    }

    async rollEvent(biome = "jungle", gmOnly = false) {
      return this.rollByType("event", biome, gmOnly);
    }

    async rollCuriosity(biome = "jungle", gmOnly = false) {
      return this.rollByType("curiosity", biome, gmOnly);
    }

    async rollResource(biome = "jungle", gmOnly = false) {
      return this.rollByType("resource", biome, gmOnly);
    }
  }