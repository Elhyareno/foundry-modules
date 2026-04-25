import { hasSpellshot, postChat } from "../utils.js";

export async function useThoughtfulReload(actor) {
  if (!actor || !hasSpellshot(actor)) {
    ui.notifications.warn("Cet acteur n'a pas Spellshot Dedication.");
    return;
  }

  await postChat(actor, "Thoughtful Reload", [
    "Effectue un Recall Knowledge contre un adversaire visible.",
    "Puis recharge l'arme par une action Interact."
  ]);
}