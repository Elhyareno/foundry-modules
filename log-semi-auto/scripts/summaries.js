export function buildPublicSummary(log) {
  const stats = getGlobalStats(log);

  return `
    <h2>⚔️ Fin de la rencontre</h2>

    <p>
      La poussière retombe sur <strong>${log.sceneName}</strong>.
      Le combat s'achève après <strong>${log.rounds}</strong> round(s).
    </p>

    <p>
      <strong>Résultat :</strong> ${log.result}<br>
      <strong>Dégâts infligés aux alliés :</strong> ${stats.damageToAllies}<br>
      <strong>Dégâts infligés aux ennemis :</strong> ${stats.damageToEnemies}<br>
      <strong>Combattants tombés :</strong> ${stats.totalDropped}
    </p>
  `;
}

export function buildPersonalReport(log, combatants) {
  const cards = combatants.map(c => `
    <div style="
      border: 1px solid #777;
      border-radius: 8px;
      padding: 8px;
      margin: 6px 0;
      background: rgba(0,0,0,0.08);
    ">
      <h3 style="margin: 0 0 4px 0;">${c.dropped ? "☠️ " : "🛡️ "}${c.name}</h3>

      <p style="margin: 2px 0;">
        <strong>PV :</strong> ${c.startHp}/${c.maxHp} → ${c.endHp}/${c.maxHp}
      </p>

      <p style="margin: 2px 0;">
        <strong>Dégâts subis :</strong> ${c.damageTaken}
      </p>

      <p style="margin: 2px 0;">
        <strong>Soins reçus :</strong> ${c.healingReceived}
      </p>

      <p style="margin: 2px 0;">
        <strong>État :</strong> ${c.dropped ? "Tombé au moins une fois" : "A terminé debout"}
      </p>
    </div>
  `).join("");

  return `
    <h2>📜 Rapport personnel de combat</h2>
    <p><strong>Lieu :</strong> ${log.sceneName}</p>
    <p><strong>Durée :</strong> ${log.rounds} round(s)</p>
    ${cards}
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
