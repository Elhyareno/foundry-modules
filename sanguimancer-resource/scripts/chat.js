import { MODULE_ID, getUserIdsForActor } from "./constants.js";

export function postToChat(actor, message, options = {}) {
  const {
    title = "Sanguimancie",
    whisper = null,
    blind = false,
    dataset = {},
  } = options;

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper,
    blind,
    flags: {
      [MODULE_ID]: {
        actorUuid: actor?.uuid ?? null,
        tokenUuid: actor?.token?.object?.document?.uuid ?? null,
        ...dataset,
      },
    },
    content: `
      <div class="sanguimancer-message">
        <strong>${title}</strong><br>
        ${message}
      </div>
    `,
  });
}

export function postPrivateToActor(actor, message, options = {}) {
  return postToChat(actor, message, {
    ...options,
    whisper: getUserIdsForActor(actor),
  });
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function makeButton(label, action, dataset = {}) {
  const data = Object.entries({
    action,
    ...dataset,
  })
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `data-${key}="${htmlEscape(value)}"`)
    .join(" ");

  return `<button type="button" class="sanguimancer-action" ${data}>${label}</button>`;
}

async function resolveActorFromButton(button, message) {
  const actorUuid =
    button.dataset.actorUuid
    ?? message.getFlag?.(MODULE_ID, "actorUuid")
    ?? null;

  const tokenUuid =
    button.dataset.tokenUuid
    ?? message.getFlag?.(MODULE_ID, "tokenUuid")
    ?? null;

  const actorId = button.dataset.actorId ?? null;

  if (actorUuid) {
    const actor = await fromUuid(actorUuid);
    if (actor) return actor;
  }

  if (tokenUuid) {
    const tokenDocument = await fromUuid(tokenUuid);
    if (tokenDocument?.actor) return tokenDocument.actor;
  }

  if (actorId) {
    const actor = game.actors.get(actorId);
    if (actor) return actor;
  }

  return null;
}

async function resolveTargetFromButton(button) {
  const targetUuid = button.dataset.targetUuid ?? null;
  const targetId = button.dataset.targetId ?? null;

  if (targetUuid) {
    const target = await fromUuid(targetUuid);
    if (target?.actor) return target.actor;
    if (target) return target;
  }

  if (targetId) {
    const target = game.actors.get(targetId);
    if (target) return target;
  }

  return null;
}

export function registerChatListeners() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    html.querySelectorAll?.(".sanguimancer-action").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();

        const action = button.dataset.action;
        const amount = Number(button.dataset.amount ?? 0);

        const actor = await resolveActorFromButton(button, message);
        const target = await resolveTargetFromButton(button);

        if (!actor) {
          ui.notifications.warn("Acteur sanguimancien introuvable.");
          return;
        }

        try {
          if (action === "exsanguinate") {
            await game.sanguimancer.useExsanguinate(actor);
          }

          if (action === "venipuncture") {
            await game.sanguimancer.useVenipuncture(actor);
          }

          if (action === "transfusion") {
            const selectedTarget = target ?? actor;
            await game.sanguimancer.useTransfusion(actor, selectedTarget, amount);
          }

          if (action === "blood-shield") {
            await game.sanguimancer.useBloodShield(actor, amount);
          }
        } catch (err) {
          console.error(`${MODULE_ID} | Chat action error`, err);
          ui.notifications.error("Erreur sanguimancie. Voir console.");
        }
      });
    });
  });
}