import { creerListeBiomesHtml, trouverBiome, creerMessageBiomeInconnuHtml } from "../utils/biomes.js";
import { envoyerMessageChat } from "../utils/chat.js";
import { createRollTypes } from "../config/rollTypes.js";
import { getWorldTimeLabel } from "../utils/worldTime.js";
import { GaiaXpService } from "./GaiaXpService.js";

export class GaiaExplorationService {
  constructor(generator) {
    this.generator = generator;
    this.rollTypes = createRollTypes(generator);
    this.excludedEntries = game.settings.get("gaia-exploration-tools", "excludedEntries") ?? {};
    this.typeToProperty = {
      event: "eventsByBiome",
      curiosity: "curiositiesByBiome",
      resource: "resourcesByBiome"
    };
  }

  async listBiomes() {
    await envoyerMessageChat(creerListeBiomesHtml());
  }

  openDialog(DialogClass) {
    new DialogClass().render(true);
  }

  async rollFromGenerator(biome, generateFn, formatFn, gmOnly = false, rollType = "event") {
    const biomeTrouve = trouverBiome(biome);

    if (!biomeTrouve) {
      await envoyerMessageChat(creerMessageBiomeInconnuHtml(biome), gmOnly);
      return null;
    }

    const typeExclusions = this.excludedEntries[rollType]?.[biomeTrouve] ?? [];

    const allEntries = this.generator[this.typeToProperty[rollType]]?.[biomeTrouve] ?? [];

    const custom = game.settings.get("gaia-exploration-tools", "customEntries") ?? {};

    const customEntries = custom[rollType]?.[biomeTrouve] ?? [];

    const uniqueEntries = new Map();

    for (const entry of [...allEntries, ...customEntries]) {
      uniqueEntries.set(entry.id, entry);
    }

    const mergedEntries = Array.from(uniqueEntries.values());

    const availableEntries = mergedEntries.filter(e => !typeExclusions.includes(e.id));

    if (availableEntries.length === 0) {
      await envoyerMessageChat("<p>Toutes les entrées ont été découvertes.</p>");
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableEntries.length);
    const result = availableEntries[randomIndex];
    const content = formatFn(result, biomeTrouve);
    const rerollButton = `
      <button 
        type="button"
        class="gaia-reroll"
        data-roll-type="${rollType}"
        data-biome="${biomeTrouve}"
        data-gm-only="${gmOnly}">
        Relancer
      </button>
    `;

    const journalButton = `
      <button
        type="button"
        class="gaia-add-journal"
        data-roll-type="${rollType}"
        data-biome="${biomeTrouve}"
        data-entry-id="${result.id}">
        Ajouter au journal
      </button>
    `;

    const removeButton = `
      <button
        type="button"
        class="gaia-remove-entry"
        data-roll-type="${rollType}"
        data-biome="${biomeTrouve}"
        data-entry-id="${result.id}">
        Retirer de la table
      </button>
    `;

    await envoyerMessageChat(content + rerollButton + journalButton + removeButton, gmOnly);
    if(!gmOnly) {
      await GaiaXpService.awardEntryXP(result, result.title);
    }
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
      gmOnly,
      type    
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

  async addToJournal(type, biome, entryId) {
    const config = this.rollTypes[type];

    if (!config) return;

    const entries = this.getMergedEntries(type, biome);

    const entry = entries?.find(e => e.id === entryId);

    if (!entry) {
      ui.notifications.warn("Entrée introuvable");
      return;
    }

    let journal = game.journal.getName("Journal d'exploration");

    if (!journal) {
      journal = await JournalEntry.create({
        name: "Journal d'exploration"
      });
    }

    const dateLabel = getWorldTimeLabel();
    const intros = [
      "Consigné",
      "Noté dans les archives",
      "Gravé dans le journal de l'expédition",
      "Ajouté aux mémoires de Gaïa",
      "Inscrit dans les relevés de terrain"
    ];

    const intro = intros[Math.floor(Math.random() * intros.length)];

    await JournalEntryPage.create({
      name: `${dateLabel} - ${entry.title}`,
      type: "text",
      text: {
        content: `
          <h2>${entry.title}</h2>
          <p><em>${intro} ${dateLabel}. Les instruments hésitent encore, mais la découverte est indéniable.</em></p>
          <p><strong>Type :</strong> ${type}</p>
          <p><strong>Biome :</strong> ${biome}</p>
          <p><strong>Récompense XP :</strong> ${entry.xp ?? 0}</p>
          <p>${entry.description}</p>
        `
      }
    }, { parent: journal });

    ui.notifications.info("Ajouté au journal !");
  }

  async excludeEntry(type, biome, entryId) {
    if (!this.excludedEntries[type]) {
      this.excludedEntries[type] = {};
    }

    if (!this.excludedEntries[type][biome]) {
      this.excludedEntries[type][biome] = [];
    }

    if (!this.excludedEntries[type][biome].includes(entryId)) {
      this.excludedEntries[type][biome].push(entryId);
    }
    
    await game.settings.set("gaia-exploration-tools", "excludedEntries", this.excludedEntries);

    ui.notifications.info("Entrée retirée de la table !");
  }

  async addCustomEntry(type, biome, entry) {
    const custom = game.settings.get("gaia-exploration-tools", "customEntries") ?? {};

    if (!custom[type]) custom[type] = {};
    if (!custom[type][biome]) custom[type][biome] = [];

    custom[type][biome].push(entry);

    await game.settings.set("gaia-exploration-tools", "customEntries", custom);

    ui.notifications.info("Entrée ajoutée !");
  }

  getMergedEntries(type, biome) {
    const baseEntries = this.generator[this.typeToProperty[type]]?.[biome] ?? [];

    const custom = game.settings.get("gaia-exploration-tools", "customEntries") ?? {};
    const customEntries = custom[type]?.[biome] ?? [];

    const uniqueEntries = new Map();

    for (const entry of [...baseEntries, ...customEntries]) {
      uniqueEntries.set(entry.id, entry);
    }

    return Array.from(uniqueEntries.values());
  }

  getAllEntriesForPicker() {
    const typeLabels = {
      event: "Événement",
      curiosity: "Curiosité",
      resource: "Ressource"
    };

    const result = [];

    for (const [type, property] of Object.entries(this.typeToProperty)) {
      const tablesByBiome = this.generator[property] ?? {};

      for (const biome of Object.keys(tablesByBiome)) {
        const entries = this.getMergedEntries(type, biome);

        for (const entry of entries) {
          result.push({
            key: `${type}::${biome}::${entry.id}`,
            id: entry.id,
            type,
            typeLabel: typeLabels[type] ?? type,
            biome,
            title: entry.title,
            xp: entry.xp ?? 0
          });
        }
      }
    }

    return result.sort((a, b) => {
      return `${a.typeLabel} ${a.biome} ${a.title}`.localeCompare(
        `${b.typeLabel} ${b.biome} ${b.title}`,
        "fr"
      );
    });
  }

  async launchEntryByKey(entryKey, gmOnly = false) {
    const [type, biome, entryId] = entryKey.split("::");

    const config = this.rollTypes[type];

    if (!config) {
      ui.notifications.warn(`Type de tirage inconnu : ${type}`);
      return null;
    }

    const entry = this.getMergedEntries(type, biome).find(e => e.id === entryId);

    if (!entry) {
      ui.notifications.warn("Entrée introuvable.");
      return null;
    }

    const content = config.format(entry, biome);

    const journalButton = `
      <button
        type="button"
        class="gaia-add-journal"
        data-roll-type="${type}"
        data-biome="${biome}"
        data-entry-id="${entry.id}">
        Ajouter au journal
      </button>
    `;

    const removeButton = `
      <button
        type="button"
        class="gaia-remove-entry"
        data-roll-type="${type}"
        data-biome="${biome}"
        data-entry-id="${entry.id}">
        Retirer de la table
      </button>
    `;

    await envoyerMessageChat(content + journalButton + removeButton, gmOnly);
    if(!gmOnly) {
      await GaiaXpService.awardEntryXP(entry, entry.title);
    }

    return entry;
  }  
}