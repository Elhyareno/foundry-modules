import { GaiaGenerator } from "./classes/GaiaGenerator.js";

Hooks.once("ready", () => {
  console.log("Gaïa Exploration Tools | Module prêt.");

  const generator = new GaiaGenerator();

  game.gaiaExploration = {
    generator,

    rollEvent(biome = "jungle") {
      const event = generator.generateEvent(biome);
      const content = generator.formatEvent(event, biome);

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker(),
        content
      });

      return event;
    }
  };

  console.log("Gaïa Exploration Tools | Commande disponible : game.gaiaExploration.rollEvent('jungle')");
});