import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";
import { BIOMES } from "./data/biomes.js";

function normaliserTexte(texte) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

Hooks.once("ready", () => {
  ui.notifications.info("Gaïa Exploration Tools chargé.");

  const generator = new GaiaGenerator();

  game.gaiaExploration = {
    generator,

    listBiomes(){
        const content = `
            <h2>Biomes disponibles</h2>
            <ul>
                ${BIOMES.map(biome => `<li>${biome}</li>`).join("")}
            </ul>
            `;
        ChatMessage.create({
            content
        });
    },

    openDialog() {
      new GaiaExplorationDialog().render(true);
    },

    async rollEvent(biome = "jungle") {  
        const nomNormalisee = normaliserTexte(biome);
        if (!BIOMES.includes(nomNormalisee)) {
            ChatMessage.create({
                content: `<p>Biome inconnu : ${biome}</p>
                <p>Biomes disponibles : ${BIOMES.join(", ")}</p>`
            });
            return null;
            }
      const event = generator.generateEvent(nomNormalisee);
      const content = generator.formatEvent(event, nomNormalisee);

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker(),
        content
      });

      return event;
    }
  };
});

Hooks.on("getSceneControlButtons", controls => {
  const tokenControls = controls.find(control => control.name === "token");

  if (!tokenControls) {
    return;
  }

  tokenControls.tools.push({
    name: "gaia-exploration",
    title: "Exploration de Gaïa",
    icon: "fas fa-seedling",
    button: true,
    onClick: () => {
      game.gaiaExploration.openDialog();
    }
  });
});