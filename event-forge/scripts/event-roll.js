import { logEventResult } from "./journal-log.js";

export async function handleEventRoll({
  skill,
  dc,
  hideDc,
  difficultyLabel,
  eventLevel,
  baseDc,
  difficultyAdjustment,
  rarity,
  title,
  eventId,
  successText,
  failureText,
  criticalSuccessText,
  criticalFailureText
}) {
  const token = canvas.tokens.controlled[0];

  if (!token?.actor) {
    ui.notifications.warn("Sélectionne d’abord ton personnage.");
    return;
  }

  const actor = token.actor;
  const skillData = actor.system.skills?.[skill];

  if (!skillData) {
    ui.notifications.error(`Compétence introuvable : ${skill}`);
    return;
  }

  const modifier =
    skillData.totalModifier ??
    skillData.mod ??
    skillData.value ??
    0;

  const roll = await new Roll(`1d20 + ${modifier}`).evaluate();
  const difficultyDisplay = hideDc
    ? `niveau ${eventLevel}, difficulté ${difficultyLabel}`
    : `DD ${dc}`;
  const d20 = roll.dice[0]?.total ?? 0;
  const total = roll.total;
  const degree = getDegreeOfSuccess(d20, total, dc);

  const resultLabel = {
    criticalSuccess: "Réussite critique",
    success: "Réussite",
    failure: "Échec",
    criticalFailure: "Échec critique"
  }[degree];

  const outcomes = {
    criticalSuccess: criticalSuccessText,
    success: successText,
    failure: failureText,
    criticalFailure: criticalFailureText
  };

  const outcomeText = outcomes[degree] ?? "";

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `
      <div class="event-forge-result">
        <h3>${foundry.utils.escapeHTML(actor.name)} tente ${foundry.utils.escapeHTML(skillData.label ?? skill)}</h3>
        <p class="event-forge-muted">Événement : ${foundry.utils.escapeHTML(title)}</p>
        <p><strong>Résultat :</strong> ${total} contre ${foundry.utils.escapeHTML(difficultyDisplay)}</p>
        ${outcomeText ? `<p class="event-forge-outcome">${foundry.utils.escapeHTML(outcomeText)}</p>` : ""}
        <p><strong>${resultLabel}</strong></p>
      </div>
    `
  });

  if (hideDc) {
    const gmUsers = game.users.filter(user => user.isGM && user.active);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      whisper: gmUsers.map(user => user.id),
      content: `
        <div class="event-forge-gm-dc">
          <h3>DD caché : ${foundry.utils.escapeHTML(title)}</h3>
          <p><strong>Personnage :</strong> ${foundry.utils.escapeHTML(actor.name)}</p>
          <p><strong>Compétence :</strong> ${foundry.utils.escapeHTML(skillData.label ?? skill)}</p>
          <p><strong>Résultat :</strong> ${total}</p>
          <p><strong>DD final :</strong> ${dc}</p>
          <p><strong>Niveau :</strong> ${eventLevel}</p>
          <p><strong>DD de base :</strong> ${baseDc}</p>
          <p>
            <strong>Difficulté :</strong>
            ${foundry.utils.escapeHTML(difficultyLabel)}
            (${difficultyAdjustment >= 0 ? "+" : ""}${difficultyAdjustment})
          </p>
          <p><strong>Rareté indicative :</strong> ${foundry.utils.escapeHTML(rarity ?? "—")}</p>
          <p><strong>Degré :</strong> ${foundry.utils.escapeHTML(resultLabel)}</p>
        </div>
      `
    });
  }

  await logEventResult({
    eventId,
    title,
    actorName: actor.name,
    total,
    dc,
    degree: resultLabel
  });
}

function getDegreeOfSuccess(d20, total, dc) {
  let degree = total >= dc + 10
    ? "criticalSuccess"
    : total >= dc
      ? "success"
      : total <= dc - 10
        ? "criticalFailure"
        : "failure";

  if (d20 === 20) {
    degree = improveDegree(degree);
  }

  if (d20 === 1) {
    degree = worsenDegree(degree);
  }

  return degree;
}

function improveDegree(degree) {
  const order = ["criticalFailure", "failure", "success", "criticalSuccess"];
  return order[Math.min(order.indexOf(degree) + 1, 3)];
}

function worsenDegree(degree) {
  const order = ["criticalFailure", "failure", "success", "criticalSuccess"];
  return order[Math.max(order.indexOf(degree) - 1, 0)];
}