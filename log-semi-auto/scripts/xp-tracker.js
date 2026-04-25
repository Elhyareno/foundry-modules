import { getSetting } from "./settings.js";

export async function handleEncounterXp(log) {
  if (!getSetting("autoAwardXp")) {
    log.xp = buildEmptyXpResult("Attribution automatique désactivée.");
    return log.xp;
  }

  const enemies = Object.values(log.combatants).filter(c => c.alliance === "enemy");
  const playerActors = getEligiblePlayerActors(log);

  if (!playerActors.length) {
    log.xp = buildEmptyXpResult("Aucun personnage joueur éligible trouvé.");
    return log.xp;
  }

  const enemyXpDetails = enemies.map(c => {
    const actor = game.actors.get(c.actorId);
    const xp = getEnemyXp(actor);

    return {
      name: c.name,
      actorId: c.actorId,
      level: getActorLevel(actor),
      xp
    };
  });

  const totalXp = enemyXpDetails.reduce((sum, e) => sum + e.xp, 0);
  const xpPerCharacter = totalXp;

  const awards = [];

  for (const actor of playerActors) {
    const before = getActorXp(actor);
    const after = before + xpPerCharacter;

    await setActorXp(actor, after);

    awards.push({
      actorId: actor.id,
      name: actor.name,
      before,
      gained: xpPerCharacter,
      after
    });
  }

  log.xp = {
    totalXp,
    xpPerCharacter,
    enemies: enemyXpDetails,
    awards,
    note: null
  };

  await sendXpMessage(log.xp);

  return log.xp;
}

function getEligiblePlayerActors(log) {
  const seen = new Set();

  return Object.values(log.combatants)
    .filter(c => c.alliance === "ally")
    .map(c => game.actors.get(c.actorId))
    .filter(actor => actor && actor.type === "character")
    .filter(actor => {
      if (seen.has(actor.id)) return false;
      seen.add(actor.id);
      return true;
    });
}

function getEnemyXp(actor) {
  if (!actor) return 0;

  const explicitXp =
    foundry.utils.getProperty(actor, "system.details.xp.value") ??
    foundry.utils.getProperty(actor, "system.details.xp");

  if (typeof explicitXp === "number" && explicitXp > 0) {
    return explicitXp;
  }

  if (getSetting("xpFallbackMode") === "none") {
    return 0;
  }

  return getLevelBasedXp(actor);
}

function getLevelBasedXp(actor) {
  const level = getActorLevel(actor);

  if (level <= -1) return 10;
  if (level === 0) return 20;
  if (level === 1) return 40;
  if (level === 2) return 60;
  if (level === 3) return 80;
  if (level === 4) return 120;

  return 120 + ((level - 4) * 40);
}

function getActorLevel(actor) {
  return Number(
    foundry.utils.getProperty(actor, "system.details.level.value") ??
    foundry.utils.getProperty(actor, "system.level.value") ??
    foundry.utils.getProperty(actor, "system.details.level") ??
    0
  );
}

function getActorXp(actor) {
  return Number(
    foundry.utils.getProperty(actor, "system.details.xp.value") ??
    0
  );
}

async function setActorXp(actor, value) {
  await actor.update({
    "system.details.xp.value": value
  });
}

async function sendXpMessage(xpResult) {
  const visibility = getSetting("xpMessageVisibility");
  if (visibility === "none") return;

  const whisper = visibility === "gm"
    ? game.users.filter(u => u.isGM).map(u => u.id)
    : undefined;

  const awards = xpResult.awards.map(a => `
    <p style="margin: 2px 0;">
      <strong>${a.name}</strong> : +${a.gained} XP 
      <span style="opacity: 0.8;">(${a.before} → ${a.after})</span>
    </p>
  `).join("");

  const enemies = xpResult.enemies.map(e => `
    <p style="margin: 2px 0;">
      ${e.name} : ${e.xp} XP
    </p>
  `).join("");

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    whisper,
    content: `
      <h2>✨ XP de rencontre</h2>

      <p>
        <strong>XP totale :</strong> ${xpResult.totalXp}<br>
        <strong>XP par personnage :</strong> ${xpResult.xpPerCharacter}
      </p>

      <h3>Attribution</h3>
      ${awards || "<p>Aucun personnage récompensé.</p>"}

      <h3>Sources</h3>
      ${enemies || "<p>Aucun ennemi pris en compte.</p>"}
    `
  });
}

function buildEmptyXpResult(note) {
  return {
    totalXp: 0,
    xpPerCharacter: 0,
    enemies: [],
    awards: [],
    note
  };
}