import { MODULE_ID, getUserIdsForActor } from "./constants.js";

export function postToChat(actor, message, options = {}) {
  const {
    title = "Sanguimancie",
    whisper = null,
    blind = false,
  } = options;

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper,
    blind,
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

export function makeButton(label, action, dataset = {}) {
  const data = Object.entries({
    action,
    ...dataset,
  })
    .map(([key, value]) => `data-${key}="${String(value)}"`)
    .join(" ");

  return `<button type="button" class="sanguimancer-action" ${data}>${label}</button>`;
}

export function registerChatListeners() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    html.querySelectorAll?.(".sanguimancer-action").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();

        const action = button.dataset.action;
        const actorId = button.dataset.actorId;
        const targetId = button.dataset.targetId;
        const amount = Number(button.dataset.amount ?? 0);

        const actor = game.actors.get(actorId);
        const target = targetId ? game.actors.get(targetId) : null;

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