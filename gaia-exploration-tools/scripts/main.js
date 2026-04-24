import { GaiaGenerator } from "./classes/GaiaGenerator.js";
import { GaiaExplorationDialog } from "./ui/GaiaExplorationDialog.js";

Hooks.once("ready", () => {
  ui.notifications.info("Gaïa Exploration Tools chargé.");
  ChatMessage.create(
    {
        content: "Le module gaiaExploration est bien chargé"
    }
  );
  game.gaiaExploration = {
    envoyerEvenementTest(){
        const evenement = {
            titre: "Mue de l'essaim",
            biome: "jungle",
            danger: 3,
            description: "Une membrane chitineuse géante pend entre deux arbres. Elle est encore tiède."
        };
        const contenu = `
        <h2>${evenement.titre}</h2>
        <p><strong>Biome :</strong> ${evenement.biome}</p>
        <p>${evenement.description}</p>
        <p><strong>Danger :</strong> ${evenement.danger}</p>
        `;
        ChatMessage.create({
            content: contenu
        });
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

