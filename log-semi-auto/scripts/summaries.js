export function buildPublicSummary(log) {
  const stats = getGlobalStats(log);

  return `
    <section class="lsa-summary">
      <h2 class="lsa-title">⚔️ Fin de la rencontre</h2>

      <p class="lsa-lead">
        La poussière retombe sur <strong>${log.sceneName}</strong>.
        Le combat s'achève après <strong>${log.rounds}</strong> round(s).
      </p>

      <p>
        <strong>Résultat :</strong>
        <span class="lsa-result">${log.result}</span>
      </p>

      <div class="lsa-stat-grid">
        <div class="lsa-stat">
          <span class="lsa-stat-label">Dégâts subis par les alliés</span>
          <span class="lsa-stat-value">${stats.damageToAllies}</span>
        </div>

        <div class="lsa-stat">
          <span class="lsa-stat-label">Dégâts subis par les ennemis</span>
          <span class="lsa-stat-value">${stats.damageToEnemies}</span>
        </div>

        <div class="lsa-stat">
          <span class="lsa-stat-label">Soins enregistrés</span>
          <span class="lsa-stat-value">${stats.totalHealing}</span>
        </div>

        <div class="lsa-stat">
          <span class="lsa-stat-label">Combattants tombés</span>
          <span class="lsa-stat-value">${stats.totalDropped}</span>
        </div>
      </div>
    </section>
  `;
}

export function buildPersonalReport(log, combatants) {
  const cards = combatants.map(c => `
    <article class="lsa-card ${c.dropped ? "lsa-danger" : "lsa-success"}">
      <h3 class="lsa-card-title">${c.dropped ? "☠️" : "🛡️"} ${c.name}</h3>

      <div class="lsa-row">
        <strong>PV</strong>
        <span>${c.startHp}/${c.maxHp} → ${c.endHp}/${c.maxHp}</span>
      </div>

      <div class="lsa-row">
        <strong>Dégâts subis</strong>
        <span>${c.damageTaken}</span>
      </div>

      <div class="lsa-row">
        <strong>Soins reçus</strong>
        <span>${c.healingReceived}</span>
      </div>

      <div class="lsa-row">
        <strong>État</strong>
        <span>${c.dropped ? "Tombé au moins une fois" : "A terminé debout"}</span>
      </div>
    </article>
  `).join("");

  return `
    <section class="lsa-report">
      <h2 class="lsa-title">📜 Rapport personnel de combat</h2>

      <p class="lsa-lead">
        <strong>Lieu :</strong> ${log.sceneName}<br>
        <strong>Durée :</strong> ${log.rounds} round(s)
      </p>

      ${cards}
    </section>
  `;
}

export function buildJournalContent(log) {
  const stats = getGlobalStats(log);

  const scoreboard = Object.values(log.combatants)
    .sort((a, b) => b.damageTaken - a.damageTaken)
    .map((c, index) => `
      <p>
        <strong>${index + 1}. ${c.name}</strong><br>
        Dégâts subis : ${c.damageTaken}<br>
        Soins reçus : ${c.healingReceived}<br>
        PV finaux : ${c.endHp}/${c.maxHp}<br>
        État : ${c.dropped ? "Tombé au combat" : "Debout"}
      </p>
    `).join("");

  const playerCrit = log.notableAttacks.playerCrit;
  const enemyCrit = log.notableAttacks.enemyCrit;

  return `
    <h1>⚔️ ${log.sceneName}</h1>

    <p>
      <strong>Date :</strong> ${new Date().toLocaleDateString()}<br>
      <strong>Début :</strong> ${log.startedAt}<br>
      <strong>Fin :</strong> ${log.endedAt}<br>
      <strong>Durée :</strong> ${log.rounds} round(s)<br>
      <strong>Résultat :</strong> ${log.result}
    </p>

    <hr>

    <h2>Résumé de la bataille</h2>

    <p>
      La rencontre s'est déroulée à <strong>${log.sceneName}</strong>.
      Les combattants ont échangé <strong>${stats.totalDamage}</strong> points de dégâts suivis,
      avec <strong>${stats.totalHealing}</strong> points de soins enregistrés.
      <strong>${stats.totalDropped}</strong> combattant(s) sont tombés au moins une fois.
    </p>

    <h2>Stats globales</h2>

    <p>
      <strong>Dégâts subis par les alliés :</strong> ${stats.damageToAllies}<br>
      <strong>Dégâts subis par les ennemis :</strong> ${stats.damageToEnemies}<br>
      <strong>Soins reçus par les alliés :</strong> ${stats.healingToAllies}<br>
      <strong>Soins reçus par les ennemis :</strong> ${stats.healingToEnemies}
    </p>

    <h2>Attaques notables</h2>

    <p>
      <strong>Plus gros critique côté joueurs :</strong><br>
      ${playerCrit ? `${playerCrit.attacker} avec ${playerCrit.damage} dégâts.` : "Aucun critique détecté."}
    </p>

    <p>
      <strong>Plus gros critique côté ennemis :</strong><br>
      ${enemyCrit ? `${enemyCrit.attacker} avec ${enemyCrit.damage} dégâts.` : "Aucun critique détecté."}
    </p>

    <h2>XP</h2>

    <p>
      <strong>XP totale :</strong> ${log.xp?.totalXp ?? 0}<br>
      <strong>XP par personnage :</strong> ${log.xp?.xpPerCharacter ?? 0}
    </p>

    ${
      log.xp?.awards?.length
        ? log.xp.awards.map(a => `
          <p>
            <strong>${a.name}</strong> : +${a.gained} XP 
            (${a.before} → ${a.after})
          </p>
        `).join("")
        : "<p>Aucune XP attribuée automatiquement.</p>"
    }

    <h2>Scoreboard</h2>
    ${scoreboard}
  `;
}

export function getGlobalStats(log) {
  const combatants = Object.values(log.combatants);

  const allies = combatants.filter(c => c.alliance === "ally");
  const enemies = combatants.filter(c => c.alliance === "enemy");

  return {
    totalDamage: combatants.reduce((sum, c) => sum + c.damageTaken, 0),
    totalHealing: combatants.reduce((sum, c) => sum + c.healingReceived, 0),
    totalDropped: combatants.filter(c => c.dropped).length,

    damageToAllies: allies.reduce((sum, c) => sum + c.damageTaken, 0),
    damageToEnemies: enemies.reduce((sum, c) => sum + c.damageTaken, 0),

    healingToAllies: allies.reduce((sum, c) => sum + c.healingReceived, 0),
    healingToEnemies: enemies.reduce((sum, c) => sum + c.healingReceived, 0)
  };
}

export function determineBattleResult(log) {
  const stats = getGlobalStats(log);

  const allies = Object.values(log.combatants).filter(c => c.alliance === "ally");
  const enemies = Object.values(log.combatants).filter(c => c.alliance === "enemy");

  const alliesDropped = allies.filter(c => c.dropped).length;
  const enemiesDropped = enemies.filter(c => c.dropped).length;

  const allyDropRatio = allies.length ? alliesDropped / allies.length : 0;
  const enemyDropRatio = enemies.length ? enemiesDropped / enemies.length : 0;

  if (enemyDropRatio >= 0.75 && allyDropRatio === 0 && stats.damageToAllies < stats.damageToEnemies * 0.25) {
    return "Victoire éclatante";
  }

  if (enemyDropRatio >= 0.75 && allyDropRatio >= 0.5) {
    return "Victoire à la Pyrrhus";
  }

  if (enemyDropRatio >= 0.5 && allyDropRatio < 0.5) {
    return "Victoire difficile";
  }

  if (allyDropRatio >= 0.75 && enemyDropRatio < 0.5) {
    return "Défaite sévère";
  }

  if (allyDropRatio >= 0.5) {
    return "Défaite coûteuse";
  }

  return "Issue incertaine";
}
