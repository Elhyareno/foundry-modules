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

  game.settings.register(MODULE_ID, "autoAwardXp", {
    name: "Attribuer automatiquement l'XP",
    hint: "Ajoute automatiquement l'XP de la rencontre aux personnages joueurs alliés à la fin du combat.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "xpMessageVisibility", {
    name: "Visibilité du message d'XP",
    hint: "Détermine qui voit le message d'attribution d'XP.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      public: "Public",
      gm: "MJ uniquement",
      none: "Aucun message"
    },
    default: "public"
  });

  game.settings.register(MODULE_ID, "xpFallbackMode", {
    name: "Calcul XP si aucune valeur trouvée",
    hint: "Méthode utilisée si l'ennemi n'a pas de valeur d'XP explicite.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      levelBased: "Selon le niveau de la créature",
      none: "Ne rien ajouter"
    },
    default: "levelBased"
  });
}

export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}