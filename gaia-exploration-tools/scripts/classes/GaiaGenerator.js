import { RandomTable } from "./RandomTable.js";
import { EVENTS_BY_BIOME } from "../data/events.js";

export class GaiaGenerator {
  constructor(eventsByBiome = EVENTS_BY_BIOME) {
    this.eventsByBiome = eventsByBiome;
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
}