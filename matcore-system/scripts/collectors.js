const TRACKED_MODULES = [
  {
    id: "lib-foundry-core",
    label: "Lib Foundry Core",
    type: "Librairie"
  },
  {
    id: "lib-pf2e-tools",
    label: "Lib PF2e Tools",
    type: "Librairie"
  },
  {
    id: "event-forge",
    label: "Event Forge",
    type: "Module"
  },
  {
    id: "log-semi-auto",
    label: "Log Semi Auto",
    type: "Module"
  },
  {
    id: "vn-widget",
    label: "Vitality Network Widget",
    type: "Module"
  },
  {
    id: "pf2e-hero-stats",
    label: "PF2e/SF2e Hero Stats",
    type: "Module"
  },
  {
    id: "gaia-exploration-tools",
    label: "Gaïa Exploration Tools",
    type: "Module"
  }
];

export function collectModuleStatus() {
  return TRACKED_MODULES.map(entry => {
    const module = game.modules.get(entry.id);

    return {
      ...entry,
      installed: Boolean(module),
      active: Boolean(module?.active),
      version: module?.version ?? "—"
    };
  });
}

export function collectHeroStats() {
  if (!game.heroStats) {
    return {
      available: false,
      totalRolls: 0,
      natural20: 0,
      natural1: 0,
      successRate: 0,
      heroGained: 0,
      heroUsed: 0,
      actors: [],
      bestActor: null,
      worstActor: null
    };
  }

  const stats = game.heroStats.getStats?.();
  const hero = game.heroStats.getHeroSummary?.();

  const actors = Array.from(stats?.actors ?? [])
    .map(actor => ({
      name: actor.name,
      totalRolls: actor.totalRolls ?? 0,
      averageD20: actor.averageD20 ?? 0,
      successRate: actor.successRate ?? 0,
      natural20: actor.natural20 ?? 0,
      natural1: actor.natural1 ?? 0,
      criticalSuccesses: actor.criticalSuccesses ?? 0,
      criticalFailures: actor.criticalFailures ?? 0
    }))
    .sort((a, b) => b.totalRolls - a.totalRolls);

  const actorsWithRolls = actors.filter(actor => actor.totalRolls > 0);

  const bestActor = actorsWithRolls.length
    ? [...actorsWithRolls].sort((a, b) => b.averageD20 - a.averageD20)[0]
    : null;

  const worstActor = actorsWithRolls.length
    ? [...actorsWithRolls].sort((a, b) => a.averageD20 - b.averageD20)[0]
    : null;

  return {
    available: true,
    totalRolls: stats?.total ?? stats?.totals?.rolls ?? 0,
    natural20: stats?.natural20 ?? stats?.totals?.natural20 ?? 0,
    natural1: stats?.natural1 ?? stats?.totals?.natural1 ?? 0,
    successRate: stats?.successRate ?? 0,
    criticalSuccesses: stats?.criticalSuccesses ?? stats?.totals?.criticalSuccesses ?? 0,
    criticalFailures: stats?.criticalFailures ?? stats?.totals?.criticalFailures ?? 0,
    heroGained: hero?.gained ?? 0,
    heroUsed: hero?.used ?? 0,
    actors,
    bestActor,
    worstActor
  };
}

function getActorClassSlug(actor) {
  const classItem = actor.items?.find(item => item.type === "class");
  return String(classItem?.slug ?? classItem?.system?.slug ?? classItem?.name ?? "").toLowerCase();
}

function looksLikeVitalityActor(actor) {
  if (!actor || actor.type !== "character") return false;

  if (game.vnWidget?.hasVitalityNetwork?.(actor)) return true;
  if (game.vnWidget?.isVitalityActor?.(actor)) return true;

  const slug = getActorClassSlug(actor);
  if (slug.includes("mystic") || slug.includes("mystique")) return true;

  const flag = actor.getFlag?.("vn-widget", "vitalityNetwork");
  if (flag !== undefined && flag !== null) return true;

  return false;
}

export function collectVitalityActors() {
  if (!game.vnWidget?.getVitalityData) {
    return [];
  }

  const actors = game.actors.filter(actor => looksLikeVitalityActor(actor));

  console.log("matcore-system | Vitality actors collectés", actors.map(actor => actor.name));

  return actors.map(actor => {
    const data = game.vnWidget.getVitalityData(actor);

    return {
      ...data,
      canUseAbilities: actor.testUserPermission(game.user, "OWNER"),
      canAdmin: game.user.isGM
    };
  });
}