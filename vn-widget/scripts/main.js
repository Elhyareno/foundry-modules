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

function registerSocket() {
  game.socket.on(SOCKET_NAME, async data => {
    if (!game.user.isGM) return;

    const responsibleGM = getResponsibleGM();
    if (responsibleGM && game.user.id !== responsibleGM.id) return;

    if (data?.type !== "TRANSFER_VITALITY") return;

    const user = game.users.get(data.userId);
    const source = game.actors.get(data.sourceActorId);
    const target = game.actors.get(data.targetActorId);

    if (!user || !source || !target) return;

    if (!source.testUserPermission(user, "OWNER")) {
      ui.notifications.warn(`${user.name} ne contrôle pas ${source.name}.`);
      return;
    }

    if (!isVitalityActor(source)) return;

    await transferVitalityToActor(source, target, data.amount);
  });
}

function exposeApi() {
  game.vnWidget = {
    isVitalityActor,

    getVitalityActors: () => {
      return game.actors.filter(actor => isVitalityActor(actor));
    },

    getVitalityData: actor => {
      const max = getVitalityMax(actor);
      const value = getVitalityValue(actor, max);
      const percent = max > 0 ? Math.round((value / max) * 100) : 0;

      return {
        actor,
        id: actor.id,
        name: actor.name,
        value,
        max,
        percent
      };
    },

    recharge: async actorId => {
      const actor = game.actors.get(actorId);
      if (!actor || !isVitalityActor(actor)) return null;

      await rechargeVitality(actor);
      return game.vnWidget.getVitalityData(actor);
    },

    empty: async actorId => {
      const actor = game.actors.get(actorId);
      if (!actor || !isVitalityActor(actor)) return null;

      await setVitality(actor, 0);
      return game.vnWidget.getVitalityData(actor);
    },

    transferVitalityToTarget: async (sourceActorId, targetActorId, amount = null) => {
      const source = game.actors.get(sourceActorId);
      const target = game.actors.get(targetActorId);

      if (!source || !target) return null;
      if (!isVitalityActor(source)) return null;

      if (game.user.isGM || target.testUserPermission(game.user, "OWNER")) {
        return transferVitalityToActor(source, target, amount);
      }

      game.socket.emit(SOCKET_NAME, {
        type: "TRANSFER_VITALITY",
        userId: game.user.id,
        sourceActorId,
        targetActorId,
        amount
      });

      return true;
    }
  };

  console.log(`${MODULE_ID} | API exposée sur game.vnWidget`);
}