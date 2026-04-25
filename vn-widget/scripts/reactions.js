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

  const parties = game.actors.filter((a) => a.type === "party");

  if (parties.length === 0) {
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

  return areTokensAdjacent(tokenA, tokenB);
}

function areTokensAdjacent(tokenA, tokenB) {
  const gridSize = canvas.grid.size;
  const maxGap = canvas.scene?.grid?.distance ?? 5;

  const boundsA = getTokenGridBounds(tokenA);
  const boundsB = getTokenGridBounds(tokenB);

  const gapX = Math.max(
    boundsB.left - boundsA.right,
    boundsA.left - boundsB.right,
    0
  );

  const gapY = Math.max(
    boundsB.top - boundsA.bottom,
    boundsA.top - boundsB.bottom,
    0
  );

  const gapInSquares = Math.max(gapX, gapY) / gridSize;
  const gapInDistance = gapInSquares * maxGap;

  return gapInDistance <= maxGap;
}

function getTokenGridBounds(token) {
  const document = token.document;

  const width = Number(document.width ?? 1);
  const height = Number(document.height ?? 1);

  const gridSize = canvas.grid.size;

  return {
    left: token.x,
    right: token.x + (width * gridSize),
    top: token.y,
    bottom: token.y + (height * gridSize)
  };
}

function getActiveToken(actor) {
  return actor.getActiveTokens(true, true)[0]
    ?? actor.getActiveTokens()[0]
    ?? null;
}

async function createSpotHealingPrompt(mystic, damagedActor, damageTaken) {
  const users = getActorOwners(mystic);
  const whisper = users.length > 0
    ? users.map((u) => u.id)
    : ChatMessage.getWhisperRecipients("GM").map((u) => u.id);

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
          data-damage-taken="${damageTaken}"
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

let spotHealingListenerRegistered = false;

export function registerSpotHealingChatListener() {
  if (spotHealingListenerRegistered) return;
  spotHealingListenerRegistered = true;

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(`button[data-action="${SPOT_HEALING_ACTION}"]`);
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    await handleSpotHealingButtonClick(button);
  });

  console.log("vn-widget | Spot Healing chat listener registered.");
}

async function handleSpotHealingButtonClick(button) {
  if (button.disabled) return;

  const mystic = game.actors.get(button.dataset.mysticId);
  const target = game.actors.get(button.dataset.targetId);
  const damageTaken = Number(button.dataset.damageTaken ?? 0);

  if (!mystic || !target) {
    ui.notifications.warn("Spot Healing : acteur introuvable.");
    return;
  }

  const amount = await askSpotHealingAmount(mystic, target, damageTaken);

  if (amount === null) return;

  const result = await transferVitalityToActor(mystic, target, amount);

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
}

async function askSpotHealingAmount(mystic, target, damageTaken) {
  const vitality = getVitalityValue(mystic);
  const hp = target.system?.attributes?.hp;

  if (!hp) {
    ui.notifications.warn("Spot Healing : les PV de la cible sont introuvables.");
    return null;
  }

  const missing = Math.max(0, Number(hp.max ?? 0) - Number(hp.value ?? 0));
  const maxAmount = Math.min(vitality, missing);
  const suggestedAmount = Math.max(0, Math.min(damageTaken, maxAmount));

  if (maxAmount <= 0) {
    ui.notifications.warn("Spot Healing : aucun soin possible.");
    return null;
  }

  return new Promise((resolve) => {
    new Dialog({
      title: "Spot Healing",
      content: `
        <form class="vn-spot-healing-dialog">
          <p>
            <strong>${target.name}</strong> peut recevoir jusqu'à
            <strong>${maxAmount}</strong> point${maxAmount > 1 ? "s" : ""} de soin.
          </p>
          <p>
            Dégâts subis : <strong>${damageTaken}</strong><br/>
            Vitality disponible : <strong>${vitality}</strong><br/>
            PV manquants : <strong>${missing}</strong>
          </p>
          <div class="form-group">
            <label>Montant à transférer</label>
            <input
              type="number"
              name="amount"
              value="${suggestedAmount}"
              min="1"
              max="${maxAmount}"
              step="1"
            />
          </div>
        </form>
      `,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-bolt"></i>',
          label: "Transférer",
          callback: (html) => {
            const root = html instanceof HTMLElement ? html : html[0];
            const input = root.querySelector('input[name="amount"]');
            const rawAmount = Number(input?.value ?? 0);

            if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
              resolve(null);
              return;
            }

            const amount = Math.max(1, Math.min(Math.floor(rawAmount), maxAmount));
            resolve(amount);
          }
        },
        max: {
          icon: '<i class="fas fa-heart"></i>',
          label: "Maximum",
          callback: () => {
            resolve(maxAmount);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Annuler",
          callback: () => {
            resolve(null);
          }
        }
      },
      default: "confirm",
      close: () => {
        resolve(null);
      }
    }).render(true);
  });
}