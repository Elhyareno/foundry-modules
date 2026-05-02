# PF2e Small Tools

Petite boîte à outils pour Foundry VTT v14, PF2e / SF2e.

## Dépendances

- `lib-foundry-core`
- `lib-pf2e-tools`

L’intégration `matcore-system` est optionnelle.

## Fonctions

### Réparation guidée d’objet

1. Le joueur sélectionne le token du propriétaire de l’objet.
2. Il lance `PF2eSmallTools.openRepairDialog()` ou utilise l’entrée MatCore.
3. Il choisit l’objet et le DD.
4. Un message est posté dans le chat.
5. Le réparateur sélectionne son token et clique sur le bouton.
6. Le module lance Artisanat et applique la réparation ou les dégâts d’échec critique.

La mise à jour de l’objet passe par socket MJ si l’utilisateur n’a pas les droits.

### Test rapide MJ

1. Le MJ lance `PF2eSmallTools.openQuickTestDialog()` ou l’entrée MatCore.
2. Il choisit une compétence, un DD et l’option de DD caché.
3. Un bouton de test apparaît dans le chat.
4. Chaque joueur sélectionne son token et clique.

## Notes techniques

Le module suit la structure des autres modules du dépôt : `main.js`, fichiers de service dédiés, intégration MatCore séparée, imports depuis les deux librairies communes.
