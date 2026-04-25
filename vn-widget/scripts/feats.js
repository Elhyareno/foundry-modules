export function hasFeat(actor, slugOrName) {
  if (!actor?.items) return false;

  const expected = String(slugOrName).trim().toLowerCase();

  return actor.items.some((item) => {
    const slug = String(item.slug ?? item.system?.slug ?? "").toLowerCase();
    const name = String(item.name ?? "").toLowerCase();

    return slug === expected || name === expected;
  });
}