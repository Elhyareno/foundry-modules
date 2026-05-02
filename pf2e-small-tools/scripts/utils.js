import { LEVEL_BASED_DCS, COMMON_SKILLS } from "./constants.js";

export function escapeHtml(value) {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

export function localize(value) {
  if (!value) return "";
  const text = String(value);
  return game.i18n?.has?.(text) ? game.i18n.localize(text) : text;
}

export function getProperty(document, path) {
  return foundry.utils.getProperty(document, path);
}

export function getItemLevel(item) {
  return Number(item?.system?.level?.value ?? item?.level ?? 0);
}

export function getLevelBasedDC(level) {
  const normalized = Math.max(-1, Math.min(25, Number(level ?? 0)));
  return LEVEL_BASED_DCS[normalized] ?? LEVEL_BASED_DCS[0];
}

export function getSystemSkillChoices(actor = null) {
  const choices = {};

  const configSkills = CONFIG.PF2E?.skills ?? CONFIG.PF2E?.skillList;

  if (configSkills && typeof configSkills === "object") {
    for (const [slug, data] of Object.entries(configSkills)) {
      const label = typeof data === "string"
        ? localize(data)
        : localize(data?.label ?? data?.name ?? slug);

      choices[slug] = label;
    }
  }

  const skillSource = actor?.system?.skills;

  if (skillSource && typeof skillSource === "object") {
    for (const [slug, data] of Object.entries(skillSource)) {
      choices[slug] = localize(data?.label ?? COMMON_SKILLS[slug] ?? slug);
    }
  }

  if (!Object.keys(choices).length) {
    Object.assign(choices, COMMON_SKILLS);
  }

  return Object.fromEntries(
    Object.entries(choices).sort((a, b) => a[1].localeCompare(b[1], "fr"))
  );
}

export function getSkillRank(actor, skillSlug) {
  const skill = actor?.system?.skills?.[skillSlug];
  const candidates = [
    skill?.rank,
    skill?.proficiency?.rank,
    skill?.proficient?.rank,
    skill?.value
  ];

  for (const candidate of candidates) {
    const rank = normalizeProficiencyRank(candidate);
    if (rank !== null) return rank;
  }

  return 0;
}

export function normalizeProficiencyRank(value) {
  if (value === null || value === undefined) return null;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 4) return numeric;

  const text = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const ranks = {
    untrained: 0,
    nonqualifie: 0,
    "non-qualifie": 0,
    trained: 1,
    qualifie: 1,
    expert: 2,
    master: 3,
    maitre: 3,
    legendary: 4,
    legendaire: 4
  };

  return ranks[text] ?? null;
}

export function getRepairAmountForCraftRank(rank) {
  return {
    0: 0,
    1: 5,
    2: 10,
    3: 30,
    4: 50
  }[Number(rank ?? 0)] ?? 0;
}

export function getD20(roll) {
  return roll?.dice?.find(die => die.faces === 20)?.total ?? 0;
}
