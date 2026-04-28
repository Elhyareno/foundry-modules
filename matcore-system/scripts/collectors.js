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
      heroGained: 0,
      heroUsed: 0
    };
  }

  const stats = game.heroStats.getStats?.();
  const hero = game.heroStats.getHeroSummary?.();

  return {
    available: true,
    totalRolls: stats?.total ?? stats?.totals?.rolls ?? 0,
    natural20: stats?.natural20 ?? stats?.totals?.natural20 ?? 0,
    natural1: stats?.natural1 ?? stats?.totals?.natural1 ?? 0,
    heroGained: hero?.gained ?? 0,
    heroUsed: hero?.used ?? 0
  };
}

export function collectVitalityActors() {
  const actors = game.actors.filter(actor => {
    if (actor.type !== "character") return false;

    const classItem = actor.items?.find(item => item.type === "class");
    const classSlug = String(
      actor.class?.slug ??
      classItem?.slug ??
      classItem?.system?.slug ??
      classItem?.name ??
      ""
    ).toLowerCase();

    return classSlug === "mystic";
  });

  return actors.map(actor => {
    const flag = actor.getFlag("world", "vitalityNetwork") ?? {};
    const level = Number(actor.system?.details?.level?.value ?? 1);
    const max = 6 + level * 4;
    const value = Math.max(0, Math.min(Number(flag.value ?? 0), max));

    return {
      id: actor.id,
      name: actor.name,
      value,
      max
    };
  });
}