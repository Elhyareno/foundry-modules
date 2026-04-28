import { RandomTable } from "./RandomTable.js";
import { EVENTS_BY_BIOME } from "../data/events.js";
import { CURIOSITIES_BY_BIOME } from "../data/curiosities.js";
import { RESOURCES_BY_BIOME } from "../data/resources.js";

export class GaiaGenerator {
  constructor(eventsByBiome = EVENTS_BY_BIOME, curiositiesByBiome = CURIOSITIES_BY_BIOME, resourcesByBiome = RESOURCES_BY_BIOME) {
    this.eventsByBiome = eventsByBiome;
    this.curiositiesByBiome = curiositiesByBiome;
    this.resourcesByBiome = resourcesByBiome;
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
        ${event.xp > 0 ? `<p><strong>Récompense XP :</strong> ${event.xp}</p>` : ''}
        <p><strong>Tags :</strong> ${tags}</p>
      </div>
    `;
  }

  generateCuriosity(biome) {
    const entries = this.curiositiesByBiome[biome];

    if (!entries) {
      return {
        title: "Biome inconnu",
        description: `Aucune table de curiosité trouvée pour le biome : ${biome}.`,
        tags: ["erreur"]
      };
    }

    const table = new RandomTable(`Curiosités : ${biome}`, entries);
    return table.roll();
  }

  formatCuriosity(curiosity, biome) {
    const tags = curiosity.tags.join(", ");

    return `
      <div class="gaia-card">
        <h2>${curiosity.title}</h2>
        <p><strong>Biome :</strong> ${biome}</p>
        <p>${curiosity.description}</p>
        ${curiosity.xp > 0 ? `<p><strong>Récompense XP :</strong> ${curiosity.xp}</p>` : ''}
        <p><strong>Tags :</strong> ${tags}</p>
      </div>
    `;
  }

  generateResource(biome) {
    const entries = this.resourcesByBiome[biome];

    if (!entries) {
      return {
        title: "Biome inconnu",
        description: `Aucune table de ressources trouvé pour le biome: ${biome}`,
        value: 0,
        tags: ["erreur"]
      };
    }

    const table = new RandomTable(`Ressources : ${biome}`, entries);
    return table.roll();
  }

  formatResource(resource, biome) {
    const tags = resource.tags.join(", ");

    return `
      <div class="gaia-card">
        <h2>${resource.title}</h2>
        <p><strong>Biome :</strong> ${biome}</p>
        <p>${resource.description}</p>
        <p><strong>Valeur :</strong> ${resource.value}</p>
        ${resource.xp > 0 ? `<p><strong>Récompense XP :</strong> ${resource.xp}</p>` : ''}
        <p><strong>Tags :</strong> ${tags}</p>
      </div>
    `;
  }
}