import { getBestDC } from "../constants.js";
import { hasVenipuncture, assertSanguimancerFeat } from "../feats.js";
import { postToChat } from "../chat.js";

export function getVenipunctureDamage(spent) {
  return Math.min(Number(spent) * 2, 80);
}

export async function useVenipuncture(actor) {
  if (!assertSanguimancerFeat(actor, hasVenipuncture, "Don Venipuncture manquant.")) return null;

  const state = await game.sanguimancer.getState(actor);

  if (state.current < 3) {
    ui.notifications.warn("Venipuncture demande au moins 3 PV sanguimanciens.");
    return null;
  }

  const { spent } = await game.sanguimancer.spendAllResource(actor, "Venipuncture");
  const damage = getVenipunctureDamage(spent);
  const dc = getBestDC(actor);

  const roll = await new DamageRoll(`${damage}[piercing]`).evaluate();

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `
      <strong>Venipuncture</strong><br>
      Émanation de 30 ft<br>
      Réflexes basique DD ${dc}<br>
      Dégâts : ${damage} perforants
    `,
  });

  postToChat(
    actor,
    `
      Venipuncture consume ${spent} PV sanguimanciens.<br>
      Réflexes basique DD ${dc}.<br>
      Dégâts : ${damage} perforants, cap 80.
    `
  );

  return {
    spent,
    damage,
    dc,
  };
}