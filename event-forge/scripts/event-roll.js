import { FCoreActors, FCoreChat, FCoreUI } from "../../lib-foundry-core/scripts/index.js";
import { PF2eRolls, PF2eSkills } from "../../lib-pf2e-tools/scripts/index.js";
import { logEventResult } from "./journal-log.js";

export async function handleEventRoll(data) {
  const actor = FCoreActors.getControlledActor();

  if (!actor) {
    FCoreUI.warn("Sélectionne d’abord ton personnage.");
    return;
  }

  const skillData = PF2eSkills.get(actor, data.skill);

  if (!skillData) {
    FCoreUI.error(`Compétence introuvable : ${data.skill}`);
    return;
  }

  const modifier = PF2eSkills.getModifier(actor, data.skill);
  const roll = await new Roll(`1d20 + ${modifier}`).evaluate();

  const d20 = roll.dice[0]?.total ?? 0;
  const total = roll.total;
  const degree = PF2eRolls.getDegreeOfSuccess(d20, total, data.dc);
  const resultLabel = PF2eRolls.getDegreeLabel(degree);

  const outcomes = {
    criticalSuccess: data.criticalSuccessText,
    success: data.successText,
    failure: data.failureText,
    criticalFailure: data.criticalFailureText
  };

  const outcomeText = outcomes[degree] ?? "";
  const difficultyDisplay = data.hideDc
    ? `niveau ${data.eventLevel}, difficulté ${data.difficultyLabel}`
    : `DD ${data.dc}`;

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `
      <div class="event-forge-result">
        <h3>${foundry.utils.escapeHTML(actor.name)} tente ${foundry.utils.escapeHTML(skillData.label ?? data.skill)}</h3>
        <p class="event-forge-muted">Événement : ${foundry.utils.escapeHTML(data.title)}</p>
        <p><strong>Résultat :</strong> ${total} contre ${foundry.utils.escapeHTML(difficultyDisplay)}</p>
        ${outcomeText ? `<p class="event-forge-outcome">${foundry.utils.escapeHTML(outcomeText)}</p>` : ""}
        <p><strong>${resultLabel}</strong></p>
      </div>
    `
  });

  if (data.hideDc) {
    await FCoreChat.send(`
      <div class="event-forge-gm-dc">
        <h3>DD caché : ${foundry.utils.escapeHTML(data.title)}</h3>
        <p><strong>Personnage :</strong> ${foundry.utils.escapeHTML(actor.name)}</p>
        <p><strong>Compétence :</strong> ${foundry.utils.escapeHTML(skillData.label ?? data.skill)}</p>
        <p><strong>Résultat :</strong> ${total}</p>
        <p><strong>DD final :</strong> ${data.dc}</p>
        <p><strong>Niveau :</strong> ${data.eventLevel}</p>
        <p><strong>DD de base :</strong> ${data.baseDc}</p>
        <p><strong>Difficulté :</strong> ${foundry.utils.escapeHTML(data.difficultyLabel)} (${data.difficultyAdjustment >= 0 ? "+" : ""}${data.difficultyAdjustment})</p>
        <p><strong>Rareté indicative :</strong> ${foundry.utils.escapeHTML(data.rarity ?? "—")}</p>
        <p><strong>Degré :</strong> ${foundry.utils.escapeHTML(resultLabel)}</p>
      </div>
    `, { gmOnly: true, actor });
  }

  await logEventResult({
    eventId: data.eventId,
    title: data.title,
    actorName: actor.name,
    total,
    dc: data.dc,
    degree: resultLabel
  });
}