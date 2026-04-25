import { creerListeBiomesHtml, trouverBiome, creerMessageBiomeInconnuHtml } from "../utils/biomes.js";
import { envoyerMessageChat } from "../utils/chat.js";
import { createRollTypes } from "../config/rollTypes.js";
import { getWorldTimeLabel } from "../utils/worldTime.js";

export class GaiaExplorationService {
    constructor(generator){
        this.generator = generator;
        this.rollTypes = createRollTypes(generator);
        this.excludedEntries = {};
        this.typeToProperty = {
            event: "eventsByBiome",
            curiosity: "curiositiesByBiome",
            resource: "resourcesByBiome"
        };
    }

    async listBiomes(){
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


      const typeExclusions = this.excludedEntries[rollType]?.[biomeTrouve] ?? new Set();
      const allEntries = this.generator[this.typeToProperty[rollType]]?.[biomeTrouve] ?? [];
      const availableEntries = allEntries.filter(e => !typeExclusions.has(e.id));
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

        const entries = this.generator[`${type}sByBiome`]?.[biome];

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
                <p>${entry.description}</p>
            `
            }
        }, { parent: journal });

        ui.notifications.info("Ajouté au journal !");
        }
    excludeEntry(type, biome, entryId) {

        if (!this.excludedEntries[type]) {
            this.excludedEntries[type] = {};
        }

        if (!this.excludedEntries[type][biome]) {
            this.excludedEntries[type][biome] = new Set();
        }

        this.excludedEntries[type][biome].add(entryId);

        ui.notifications.info("Entrée retirée de la table !");
        }
  }