import { hasSpellshot, postChat } from "../utils.js";

export async function useDispellingBullet(actor) {
  if (!actor || !hasSpellshot(actor)) {
    ui.notifications.warn("Cet acteur n'a pas Spellshot Dedication.");
    return;
  }

  const level =
    actor.level ??
    actor.system?.details?.level?.value ??
    1;

  const classDC =
    actor.system?.attributes?.classDC?.value ??
    actor.system?.attributes?.spellDC?.value ??
    10;

  const counteractRank = Math.ceil(level / 2);
  const counteractModifier = classDC - 10;

  await postChat(actor, "Dispelling Bullet", [
    "Après une Strike réussie, choisis un effet magique actif sur la cible.",
    `Rang de contre-acte suggéré : ${counteractRank}.`,
    `Modificateur de contre-acte suggéré : +${counteractModifier}.`
  ]);
}