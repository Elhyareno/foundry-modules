import { MODULE_ID } from "./state.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "journalName", {
    name: "Nom du journal de combat",
    hint: "Nom du journal dans lequel les rencontres archivées seront enregistrées.",
    scope: "world",
    config: true,
    type: String,
    default: "Journal de combat"
  });

  game.settings.register(MODULE_ID, "sendPublicSummary", {
    name: "Envoyer le résumé public",
    hint: "Publie un résumé synthétique dans le chat à la fin du combat.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "sendPrivateReports", {
    name: "Envoyer les rapports privés",
    hint: "Envoie à chaque joueur son rapport détaillé, avec copie au MJ.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "sendGmArchivePrompt", {
    name: "Demander l’archivage au MJ",
    hint: "Envoie au MJ un message privé avec bouton pour ajouter la rencontre au journal.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
}

export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}