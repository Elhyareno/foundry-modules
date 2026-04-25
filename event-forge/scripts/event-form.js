import { logEventCreation } from "./journal-log.js";

const FALLBACK_SKILLS = [
  { key: "acrobatics", label: "Acrobatics" },
  { key: "arcana", label: "Arcana" },
  { key: "athletics", label: "Athletics" },
  { key: "crafting", label: "Crafting" },
  { key: "deception", label: "Deception" },
  { key: "diplomacy", label: "Diplomacy" },
  { key: "intimidation", label: "Intimidation" },
  { key: "medicine", label: "Medicine" },
  { key: "nature", label: "Nature" },
  { key: "occultism", label: "Occultism" },
  { key: "performance", label: "Performance" },
  { key: "religion", label: "Religion" },
  { key: "society", label: "Society" },
  { key: "stealth", label: "Stealth" },
  { key: "survival", label: "Survival" },
  { key: "thievery", label: "Thievery" }
];

const DC_BY_LEVEL = {
  0: 14,
  1: 15,
  2: 16,
  3: 18,
  4: 19,
  5: 20,
  6: 22,
  7: 23,
  8: 24,
  9: 26,
  10: 27,
  11: 28,
  12: 30,
  13: 31,
  14: 32,
  15: 34,
  16: 35,
  17: 36,
  18: 38,
  19: 39,
  20: 40,
  21: 42,
  22: 44,
  23: 46,
  24: 48,
  25: 50
};

const DIFFICULTY_ADJUSTMENTS = {
  incrediblyEasy: {
    label: "Incredibly easy",
    adjustment: -10,
    rarity: "—"
  },
  veryEasy: {
    label: "Very easy",
    adjustment: -5,
    rarity: "—"
  },
  easy: {
    label: "Easy",
    adjustment: -2,
    rarity: "—"
  },
  standard: {
    label: "Standard",
    adjustment: 0,
    rarity: "—"
  },
  hard: {
    label: "Hard",
    adjustment: 2,
    rarity: "Uncommon"
  },
  veryHard: {
    label: "Very hard",
    adjustment: 5,
    rarity: "Rare"
  },
  incrediblyHard: {
    label: "Incredibly hard",
    adjustment: 10,
    rarity: "Unique"
  }
};

function calculateDc(eventLevel, difficultyKey) {
  const level = Number(eventLevel);
  const baseDc = DC_BY_LEVEL[level] ?? DC_BY_LEVEL[1];
  const difficulty = DIFFICULTY_ADJUSTMENTS[difficultyKey] ?? DIFFICULTY_ADJUSTMENTS.standard;

  return {
    level,
    baseDc,
    difficultyKey,
    difficultyLabel: difficulty.label,
    difficultyAdjustment: difficulty.adjustment,
    rarity: difficulty.rarity,
    dc: baseDc + difficulty.adjustment
  };
}

function getAvailableSkills() {
  const actor =
    canvas.tokens.controlled[0]?.actor ??
    game.actors.find(a => a.type === "character" && a.system?.skills);

  const skills = actor?.system?.skills;

  if (!skills) {
    return FALLBACK_SKILLS;
  }

  return Object.entries(skills)
    .filter(([key, skill]) => !skill.lore)
    .map(([key, skill]) => ({
      key,
      label: skill.label ?? skill.slug ?? key
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}


export class EventForgeForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "event-forge-form",
      title: "Créer un événement",
      template: "modules/event-forge/templates/event-form.hbs",
      width: 520,
      height: "auto",
      closeOnSubmit: true
    });
  }

  getData() {
    return {
      skills: getAvailableSkills(),
      levels: Object.keys(DC_BY_LEVEL).map(level => ({
        value: Number(level),
        label: `Niveau ${level}`
      })),
      difficulties: Object.entries(DIFFICULTY_ADJUSTMENTS).map(([key, data]) => ({
        key,
        label: `${data.label} (${data.adjustment >= 0 ? "+" : ""}${data.adjustment})`
      }))
    };
  }

  async _updateObject(event, formData) {
    const eventId = foundry.utils.randomID();

    const title = formData.title;
    const skill = formData.skill;
    const skills = getAvailableSkills();
    const skillLabel = skills.find(s => s.key === skill)?.label ?? skill;
    const eventLevel = Number(formData.eventLevel ?? 1);
    const difficultyKey = formData.difficultyKey || "standard";
    const dcData = calculateDc(eventLevel, difficultyKey);

    const dc = dcData.dc;
    const hideDc = Boolean(formData.hideDc);
    const difficultyLabel = dcData.difficultyLabel;
    const difficultyAdjustment = dcData.difficultyAdjustment;
    const baseDc = dcData.baseDc;
    const rarity = dcData.rarity;

    const testDisplay = hideDc
      ? `${skillLabel} — Difficulté : ${difficultyLabel}`
      : `${skillLabel} DD ${dc}`;
    const fluff = formData.fluff;
    const criticalSuccess = formData.criticalSuccess?.trim() || "";
    const success = formData.success?.trim() || "";
    const failure = formData.failure?.trim() || "";
    const criticalFailure = formData.criticalFailure?.trim() || "";

    const content = `
      <div class="event-forge-card" data-event-id="${eventId}">
        <h2>${title}</h2>
        <p class="event-forge-fluff">${fluff}</p>

        <p><strong>Test demandé :</strong> ${testDisplay}</p>

        <button
          class="event-forge-roll"
          data-event-id="${eventId}"
          data-title="${foundry.utils.escapeHTML(title)}"
          data-skill="${skill}"
          data-dc="${dc}"
          data-hide-dc="${hideDc}"
          data-difficulty-label="${foundry.utils.escapeHTML(difficultyLabel)}"
          data-event-level="${eventLevel}"
          data-base-dc="${baseDc}"
          data-difficulty-adjustment="${difficultyAdjustment}"
          data-rarity="${foundry.utils.escapeHTML(rarity)}"
          data-critical-success="${foundry.utils.escapeHTML(criticalSuccess)}"
          data-success="${foundry.utils.escapeHTML(success)}"
          data-failure="${foundry.utils.escapeHTML(failure)}"
          data-critical-failure="${foundry.utils.escapeHTML(criticalFailure)}">
          Lancer le test
        </button>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content,
      flags: {
        "event-forge": {
          eventId,
          title,
          skill,
          skillLabel,
          dc,
          fluff,
          criticalSuccess,
          success,
          failure,
          criticalFailure,
          results: [],
          testDisplay,
          difficultyLabel,
          eventLevel,
          baseDc,
          difficultyAdjustment,
          rarity
        }
      }
    });

    await logEventCreation({
      eventId,
      title,
      skillLabel,
      dc,
      fluff,
      success,
      failure,
      criticalSuccess,
      criticalFailure,
      testDisplay,
      difficultyLabel,
      eventLevel,
      baseDc,
      difficultyAdjustment,
      rarity
    });
  }
}