import { EventForgeForm } from "./event-form.js";
import { handleEventRoll } from "./event-roll.js";

Hooks.once("init", () => {
  console.log("Event Forge | Initialisation");

  globalThis.EventForge = {
    open: () => new EventForgeForm().render(true)
  };
});

Hooks.on("renderChatMessage", (message, html) => {
  html.find(".event-forge-roll").on("click", async event => {
    event.preventDefault();

    const button = event.currentTarget;
    const skill = button.dataset.skill;
    const dc = Number(button.dataset.dc);
    const title = button.dataset.title;
    const eventId = button.dataset.eventId;

    await handleEventRoll({
      skill: button.dataset.skill,
      dc: Number(button.dataset.dc),
      title: button.dataset.title,
      eventId: button.dataset.eventId,
      successText: button.dataset.success,
      failureText: button.dataset.failure
    });
  });
});