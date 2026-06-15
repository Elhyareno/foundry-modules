import { getSetting } from "./settings.js";

export async function handleEncounterXp(log) {
  if (!getSetting("autoAwardXp")) {
    log.xp = buildEmptyXpResult("Attribution automatique désactivée.");
    return log.xp;
  }

  // 1. On récupère le combat actif de Foundry
  const activeCombat = game.combats.active;
  if (!activeCombat) {
    log.xp = buildEmptyXpResult("Aucun combat actif trouvé pour récupérer l'XP.");
    return log.xp;
  }

  // 2. On extrait l'XP calculée par le tracker PF2e (avec un fallback à 0 au cas où)
  const pf2eAwardedXp = activeCombat.system?.awards?.xp ?? 0;

  // 3. Récupération des PJ éligibles depuis ton log
  const playerActors = getEligiblePlayerActors(log);
  if (!playerActors.length) {
    log.xp = buildEmptyXpResult("Aucun personnage joueur éligible trouvé.");
    return log.xp;
  }

  // En PF2e, chaque PJ reçoit la valeur complète de la rencontre (pas de division)
  const totalXp = pf2eAwardedXp;
  const xpPerCharacter = pf2eAwardedXp;

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

  // Pour garder l'affichage des sources dans ton template HTML sans bugger,
  // on liste simplement les ennemis du log sans recalculer leur XP individuelle
  const enemyXpDetails = Object.values(log.combatants)
    .filter(c => c.alliance === "enemy")
    .map(c => ({
      name: c.name,
      actorId: c.actorId,
      level: getActorLevel(c.actor || game.actors.get(c.actorId)),
      xp: "Inclus" // Texte cosmétique pour ton template
    }));

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
    .map(c => game.actors.get(c.actorId) || c.actor)
    .filter(actor => {
      if (!actor || actor.type !== "character") return false;
      
      // Sécurité anti-doublons si un joueur a plusieurs tokens en combat
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
  if (!actor) return 0;
  return Number(foundry.utils.getProperty(actor, "system.details.level.value") ?? 0);
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
  <article class="lsa-score-entry lsa-success">
    <strong>${a.name}</strong><br>
    +${a.gained} XP <span class="lsa-muted">(${a.before} → ${a.after})</span>
  </article>
`).join("");

  const enemies = xpResult.enemies.map(e => `
  <article class="lsa-score-entry">
    <strong>${e.name}</strong><br>
    ${e.xp} XP
  </article>
`).join("");

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    whisper,
    content: `
  <section class="lsa-xp">
    <h2 class="lsa-title">✨ XP de rencontre</h2>

    <div class="lsa-stat-grid">
      <div class="lsa-stat">
        <span class="lsa-stat-label">XP totale</span>
        <span class="lsa-stat-value">${xpResult.totalXp}</span>
      </div>

      <div class="lsa-stat">
        <span class="lsa-stat-label">XP par personnage</span>
        <span class="lsa-stat-value">${xpResult.xpPerCharacter}</span>
      </div>
    </div>

    <h3 class="lsa-subtitle">Attribution</h3>
    ${
      awards || "<p class='lsa-muted'>Aucun personnage récompensé.</p>"
    }

    <h3 class="lsa-subtitle">Sources</h3>
    ${
      enemies || "<p class='lsa-muted'>Aucun ennemi pris en compte.</p>"
    }
  </section>
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