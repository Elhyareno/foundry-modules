import { MODULE_ID, SOCKET_NAME } from "./constants.js";
import { renderVitalityWidget } from "./sheet.js";
import { handleCombatUpdate } from "./combat.js";
import { handlePreUpdateActorForRest } from "./rest.js";
import {
  handleSpotHealingTrigger,
  registerSpotHealingChatListener
} from "./reactions.js";
import {
  getVitalityMax,
  getVitalityValue,
  setVitality,
  rechargeVitality
} from "./resource.js";
import { transferVitalityToActor } from "./healing.js";
import { isVitalityActor } from "./actor.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialisation`);
});

Hooks.once("ready", () => {
  registerSpotHealingChatListener();
  registerSocket();
  exposeApi();
});

Hooks.on("renderActorSheet", async (app, html) => {
  await renderVitalityWidget(app, html);
});

Hooks.on("updateCombat", async (combat, changed, options, userId) => {
  await handleCombatUpdate(combat, changed, options, userId);
});

Hooks.on("preUpdateActor", async (actor, changed, options, userId) => {
  await handlePreUpdateActorForRest(actor, changed, options, userId);
  await handleSpotHealingTrigger(actor, changed, options, userId);
});

function getResponsibleGM() {
  return game.users.find(user => user.active && user.isGM);
}

async function resolveActorFromUuid(uuidOrId) {
  if (!uuidOrId) return null;

  const directActor = game.actors.get(uuidOrId);
  if (directActor) return directActor;

  const doc = await fromUuid(uuidOrId);
  if (!doc) return null;

  // TokenDocument ou token-like : l’acteur est porté par le token.
  if (doc.actor) return doc.actor;

  // Actor classique.
  if (doc.documentName === "Actor") return doc;

  return null;
}

function hasVitalityNetwork(actor) {
  if (!actor || actor.type !== "character") return false;

  const max = Number(getVitalityMax(actor) ?? 0);
  return Number.isFinite(max) && max > 0;
}

function registerSocket() {
  game.socket.on(SOCKET_NAME, async data => {
    if (!game.user.isGM) return;

    const responsibleGM = getResponsibleGM();
    if (responsibleGM && game.user.id !== responsibleGM.id) return;

    if (data?.type !== "TRANSFER_VITALITY") return;

    const user = game.users.get(data.userId);
    const source = await resolveActorFromUuid(data.sourceUuid);
    const target = await resolveActorFromUuid(data.targetUuid);

    if (!user || !source || !target) return;

    if (!source.testUserPermission(user, "OWNER")) {
      ui.notifications.warn(`${user.name} ne contrôle pas ${source.name}.`);
      return;
    }

    if (!hasVitalityNetwork(source)) return;

    await transferVitalityToActor(source, target, data.amount);
  });
}

function exposeApi() {
  game.vnWidget = {
    isVitalityActor,

    hasVitalityNetwork,

    getVitalityActors: () => {
      return game.actors.filter(actor => hasVitalityNetwork(actor));
    },

    getVitalityData: actor => {
      if (!actor) return null;

      const max = Number(getVitalityMax(actor) ?? 0);
      const value = Number(getVitalityValue(actor, max) ?? 0);
      const percent = max > 0 ? Math.round((value / max) * 100) : 0;

      return {
        actor,
        id: actor.id,
        uuid: actor.uuid,
        name: actor.name,
        value,
        max,
        percent
      };
    },

    recharge: async actorUuidOrId => {
      const actor = await resolveActorFromUuid(actorUuidOrId);

      if (!actor || !hasVitalityNetwork(actor)) return null;

      await rechargeVitality(actor);
      return game.vnWidget.getVitalityData(actor);
    },

    empty: async actorUuidOrId => {
      const actor = await resolveActorFromUuid(actorUuidOrId);

      if (!actor || !hasVitalityNetwork(actor)) return null;

      await setVitality(actor, 0);
      return game.vnWidget.getVitalityData(actor);
    },

    transferVitalityToTarget: async (sourceUuid, targetUuid, amount = null) => {
      const source = await resolveActorFromUuid(sourceUuid);
      const target = await resolveActorFromUuid(targetUuid);

      if (!source || !target) return null;
      if (!hasVitalityNetwork(source)) return null;

      if (!game.user.isGM) {
        game.socket.emit(SOCKET_NAME, {
          type: "TRANSFER_VITALITY",
          userId: game.user.id,
          sourceUuid,
          targetUuid,
          amount
        });

        return true;
      }

      return transferVitalityToActor(source, target, amount);
    }
  };

  console.log(`${MODULE_ID} | API exposée sur game.vnWidget`);
}