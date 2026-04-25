import { MODULE_ID, SLUGS } from "./constants.js";

export function isCharacter(actor) {
  return actor?.type === "character";
}

export function hasSpellshot(actor) {
  if (!actor?.items) return false;

  return actor.items.some((item) => {
    const slug = item.slug ?? item.system?.slug ?? "";
    return slug === SLUGS.SPELLSHOT_DEDICATION;
  });
}

export function getFlag(actor, key, fallback = null) {
  return actor?.getFlag(MODULE_ID, key) ?? fallback;
}

export async function setFlag(actor, key, value) {
  return actor?.setFlag(MODULE_ID, key, value);
}

export async function unsetFlag(actor, key) {
  return actor?.unsetFlag(MODULE_ID, key);
}

export function debug(...args) {
  console.log(`${MODULE_ID} |`, ...args);
}

export async function postChat(actor, title, lines = []) {
  const content = `
    <div class="pfsh-chat">
      <p><strong>${title}</strong></p>
      ${lines.map((line) => `<p>${line}</p>`).join("")}
    </div>
  `;

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
}

export function getActorFromMessage(message) {
  const actorId =
    message?.speaker?.actor ??
    message?.flags?.pf2e?.origin?.actor ??
    null;

  if (!actorId) return null;
  return game.actors.get(actorId) ?? null;
}

export function getMessageContext(message) {
  return message?.flags?.pf2e?.context ?? {};
}

export function getOutcomeFromMessage(message) {
  const context = getMessageContext(message);
  return (
    context?.outcome ??
    context?.result?.outcome ??
    message?.flags?.pf2e?.outcome ??
    null
  );
}

export function getItemIdFromMessage(message) {
  const context = getMessageContext(message);

  return (
    context?.item?.id ??
    context?.strike?.item?.id ??
    message?.flags?.pf2e?.item?.id ??
    null
  );
}

export function getItemFromMessage(message, actor = null) {
  const realActor = actor ?? getActorFromMessage(message);
  if (!realActor) return null;

  const itemId = getItemIdFromMessage(message);
  if (!itemId) return null;

  return realActor.items.get(itemId) ?? null;
}

export function isWeapon(item) {
  return item?.type === "weapon";
}

export function isFirearmOrCrossbow(item) {
  if (!isWeapon(item)) return false;

  const traits = item.system?.traits?.value ?? [];
  const group = item.group ?? item.system?.group ?? "";
  const baseType = item.baseType ?? item.system?.baseItem ?? "";

  const haystack = [
    ...traits,
    group,
    baseType
  ].map((x) => String(x).toLowerCase());

  return haystack.some((entry) => {
    return entry.includes("firearm") || entry.includes("crossbow");
  });
}

export function getWeaponDamageDice(item) {
  return Math.max(1, Number(item?.system?.damage?.dice ?? 1));
}

export function isAttackRollMessage(message) {
  const context = getMessageContext(message);
  const type = context?.type ?? "";
  const domains = context?.domains ?? [];

  return (
    type === "attack-roll" ||
    domains.includes("attack") ||
    domains.includes("strike-attack-roll")
  );
}

export function isDamageRollMessage(message) {
  const context = getMessageContext(message);
  const type = context?.type ?? "";
  const domains = context?.domains ?? [];

  return (
    type === "damage-roll" ||
    domains.includes("damage") ||
    domains.includes("strike-damage")
  );
}

export async function chooseEnergyType(actor) {
  const { ENERGY_TYPES } = await import("./constants.js");

  const options = ENERGY_TYPES.map(
    (e) => `<option value="${e.value}">${e.label}</option>`
  ).join("");

  return new Promise((resolve) => {
    new foundry.applications.api.DialogV2({
      window: {
        title: `Energy Shot • ${actor.name}`
      },
      content: `
        <form>
          <div class="form-group">
            <label>Type d'énergie</label>
            <select id="pfsh-energy-type">${options}</select>
          </div>
        </form>
      `,
      buttons: [
        {
          action: "ok",
          label: "Valider",
          callback: (_event, button, dialog) => {
            const html = dialog.element;
            const value = html.querySelector("#pfsh-energy-type")?.value ?? null;
            resolve(value);
          }
        },
        {
          action: "cancel",
          label: "Annuler",
          callback: () => resolve(null)
        }
      ]
    }).render(true);
  });
}