import { isVitalityActor } from "./actor.js";
import { getVitalityValue } from "./resource.js";
import { hasFeat } from "./feats.js";
import { transferVitalityToActor } from "./healing.js";

const SPOT_HEALING_FEAT = "spot healing";
const SPOT_HEALING_ACTION = "vn-spot-healing";

export async function handleSpotHealingTrigger(actor, changed, options, userId) {
  if (!game.user.isGM) return;
  if (!actor || actor.type !== "character") return;
  if (!isPartyMember(actor)) return;

  const oldHP = actor.system?.attributes?.hp?.value;
  const newHP = changed?.system?.attributes?.hp?.value;

  if (!Number.isFinite(Number(oldHP))) return;
  if (!Number.isFinite(Number(newHP))) return;

  const damageTaken = Number(oldHP) - Number(newHP);

  if (damageTaken <= 0) return;

  const mystics = getPartyMysticsWithSpotHealing();

  for (const mystic of mystics) {
    if (mystic.id === actor.id) continue;
    if (getVitalityValue(mystic) <= 0) continue;
    if (!areActorsAdjacent(mystic, actor)) continue;

    await createSpotHealingPrompt(mystic, actor, damageTaken);
  }
}

function getPartyMysticsWithSpotHealing() {
  return game.actors.filter((actor) =>
    actor.type === "character" &&
    isPartyMember(actor) &&
    isVitalityActor(actor) &&
    hasFeat(actor, SPOT_HEALING_FEAT)
  );
}

function isPartyMember(actor) {
  if (!actor) return false;

  // SF2e/PF2e party actors usually contain member references.
  const parties = game.actors.filter((a) => a.type === "party");

  if (parties.length === 0) {
    // Fallback simple : tous les personnages joueurs sont considérés comme party.
    return actor.hasPlayerOwner;
  }

  return parties.some((party) => {
    const members = party.system?.details?.members
      ?? party.system?.members
      ?? party.members
      ?? [];

    const memberIds = Array.from(members).map((member) => {
      if (typeof member === "string") return member;
      return member.id ?? member.uuid ?? member.actor?.id ?? member.actorId;
    });

    return memberIds.includes(actor.id) || memberIds.includes(actor.uuid);
  });
}

function areActorsAdjacent(actorA, actorB) {
  const tokenA = getActiveToken(actorA);
  const tokenB = getActiveToken(actorB);

  if (!tokenA || !tokenB) return false;
  if (tokenA.scene?.id !== tokenB.scene?.id) return false;

  const distance = canvas.grid.measurePath([
    tokenA.center,
    tokenB.center
  ]).distance;

  const gridDistance = canvas.scene?.grid?.distance ?? 5;

  return distance <= gridDistance;
}

function getActiveToken(actor) {
  return actor.getActiveTokens(true, true)[0]
    ?? actor.getActiveTokens()[0]
    ?? null;
}

async function createSpotHealingPrompt(mystic, damagedActor, damageTaken) {
  const users = getActorOwners(mystic);
  const whisper = users.length > 0 ? users.map((u) => u.id) : ChatMessage.getWhisperRecipients("GM").map((u) => u.id);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: mystic }),
    whisper,
    content: `
      <div class="vn-chat vn-spot-healing-card">
        <div class="vn-chat-title">🩹 Spot Healing</div>
        <p>
          <strong>${damagedActor.name}</strong>, allié lié adjacent, vient de subir
          <strong>${damageTaken}</strong> point${damageTaken > 1 ? "s" : ""} de dégâts.
        </p>
        <p>
          <strong>${mystic.name}</strong> peut utiliser <em>Transfer Vitality</em>.
        </p>
        <button
          type="button"
          data-action="${SPOT_HEALING_ACTION}"
          data-mystic-id="${mystic.id}"
          data-target-id="${damagedActor.id}"
        >
          Utiliser Transfer Vitality
        </button>
      </div>
    `
  });
}

function getActorOwners(actor) {
  return game.users.filter((user) => {
    if (user.isGM) return false;
    return actor.testUserPermission(user, "OWNER");
  });
}

export function registerSpotHealingChatListener() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    bindSpotHealingButtons(html);
  });

  // Compatibilité v13/v14 si renderChatMessageHTML ne passe pas selon certains contextes.
  Hooks.on("renderChatMessage", (message, html) => {
    const element = html instanceof HTMLElement ? html : html[0];
    bindSpotHealingButtons(element);
  });
}

function bindSpotHealingButtons(html) {
  if (!html) return;

  const buttons = html.querySelectorAll(`button[data-action="${SPOT_HEALING_ACTION}"]`);

  for (const button of buttons) {
    if (button.dataset.vnBound === "true") continue;
    button.dataset.vnBound = "true";

    button.addEventListener("click", async () => {
      const mystic = game.actors.get(button.dataset.mysticId);
      const target = game.actors.get(button.dataset.targetId);

      if (!mystic || !target) {
        ui.notifications.warn("Spot Healing : acteur introuvable.");
        return;
      }

      const result = await transferVitalityToActor(mystic, target);

      if (!result) {
        ui.notifications.warn("Spot Healing : transfert impossible.");
        return;
      }

      button.disabled = true;
      button.textContent = "Transfer Vitality utilisé";

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: mystic }),
        content: `
          <div class="vn-chat">
            <div class="vn-chat-title">🩹 Spot Healing</div>
            <p>
              <strong>${mystic.name}</strong> transfère
              <strong>${result.healed}</strong> point${result.healed > 1 ? "s" : ""}
              de Vitality Network à <strong>${target.name}</strong>.
            </p>
            <p>
              ${target.name} : <strong>${result.targetHP}/${result.targetMaxHP}</strong> PV.
            </p>
            <p>
              Vitality restante : <strong>${result.remainingVitality}</strong>.
            </p>
          </div>
        `
      });
    });
  }
}