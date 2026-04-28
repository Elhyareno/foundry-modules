import { FCoreChat } from "../../lib-foundry-core/scripts/index.js";
import { getVitalityMax, getVitalityValue, setVitality } from "./resource.js";
import { isVitalityActor, getSpellcastingDCRank } from "./actor.js";

export async function handleCombatUpdate(combat, changed, options, userId) {
  if (!game.user.isGM) return;

  const hasTurnChanged = Object.hasOwn(changed, "turn");
  const hasRoundChanged = Object.hasOwn(changed, "round");

  if (!hasTurnChanged && !hasRoundChanged) return;

  const combatant = combat.combatant;
  if (!combatant) return;

  const actor = combatant.actor;
  if (!isVitalityActor(actor)) return;

  await regenerateVitality(actor);
}

async function regenerateVitality(actor) {
  const max = getVitalityMax(actor);
  const current = getVitalityValue(actor, max);
  const rank = getSpellcastingDCRank(actor);
  const regen = getVitalityRegenFromRank(rank);
  const next = Math.min(current + regen, max);
  const gained = next - current;

  if (gained <= 0) return;

  await setVitality(actor, next);

  await FCoreChat.send(`
    <div class="vn-chat">
      <div class="vn-chat-title">⚡ Vitality Network</div>
      <p>
        <strong>${actor.name}</strong> récupère
        <strong>${gained}</strong> point${gained > 1 ? "s" : ""} de Vitality Network.
      </p>
      <p>
        Maîtrise du DD de sort : <strong>${getProficiencyLabel(rank)}</strong>
        <small>(rang ${rank}, régénération +${regen})</small>
      </p>
      <p>
        Réserve actuelle : <strong>${next}/${max}</strong>
      </p>
    </div>
  `, { actor });
}

function getVitalityRegenFromRank(rank) {
  if (rank >= 4) return 8;
  if (rank >= 3) return 6;

  return 4;
}

function getProficiencyLabel(rank) {
  if (rank >= 4) return "légendaire";
  if (rank >= 3) return "maître";
  if (rank >= 2) return "expert";
  if (rank >= 1) return "qualifié";

  return "non qualifié";
}