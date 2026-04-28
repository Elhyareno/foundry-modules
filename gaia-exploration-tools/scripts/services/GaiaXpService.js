import { PF2eActor } from "../../../lib-pf2e-tools/scripts/actor.js";

export class GaiaXpService {
  static async awardEntryXP(entry, reason = "Exploration de Gaïa") {
    const xp = Number(entry?.xp ?? 0);

    if (!Number.isFinite(xp) || xp <= 0) {
      return [];
    }

    const actors = await PF2eActor.addXPToParty(xp, reason);

    if (!actors.length) {
      return [];
    }

    const actorNames = actors.map(actor => actor.name).join(", ");

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Gaïa Exploration" }),
      content: `
        <div class="gaia-card gaia-xp-card">
          <h2>XP d’exploration</h2>
          <p><strong>${xp} XP</strong> attribués au groupe.</p>
          <p><strong>Raison :</strong> ${reason}</p>
          <p><strong>Personnages :</strong> ${actorNames}</p>
        </div>
      `
    });

    return actors;
  }
}