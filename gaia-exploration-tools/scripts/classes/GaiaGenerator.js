import { RandomTable } from "./RandomTable.js";
import { EVENTS_BY_BIOME } from "../data/events.js";
import { CURIOSITIES_BY_BIOME } from "../data/curiosities.js";

export class GaiaGenerator {
  constructor(eventsByBiome = EVENTS_BY_BIOME, curiositiesByBiome = CURIOSITIES_BY_BIOME) {
    this.eventsByBiome = eventsByBiome;
    this.curiositiesByBiome = curiositiesByBiome;
  }

  generateEvent(biome) {
    const entries = this.eventsByBiome[biome];

    if (!entries) {
      return {
        title: "Biome inconnu",
        description: `Aucune table d'événements trouvée pour le biome : ${biome}.`,
        danger: 0,
        tags: ["erreur"]
      };
    }

    const table = new RandomTable(`Événements : ${biome}`, entries);
    return table.roll();
  }

  formatEvent(event, biome) {
    const tags = event.tags.join(", ");

    return `
      <div class="gaia-card">
        <h2>${event.title}</h2>
        <p><strong>Biome :</strong> ${biome}</p>
        <p>${event.description}</p>
        <p><strong>Danger :</strong> ${event.danger}</p>
        <p><strong>Tags :</strong> ${tags}</p>
      </div>
    `;
  }

  generateCuriosity(biome){
    const entries = this.curiositiyByBiome[biome];

    if (!entries){
        return {
        title: "Biome inconnu",
        description: `Aucune table de curiosité trouvée pour le biome : ${biome}.`,
        tags: ["erreur"]
      };
    }

    const table = new RandomTable(`Curiosités : ${biome}`, entries);
    return table.roll();
  }

  formatCuriosity(curiosities, biome) {
    const tags = curiosities.tags.join(", ");

    return `
      <div class="gaia-card">
        <h2>${curiosities.title}</h2>
        <p><strong>Biome :</strong> ${biome}</p>
        <p>${curiosities.description}</p>
        <p><strong>Tags :</strong> ${tags}</p>
      </div>
    `;
  }

}