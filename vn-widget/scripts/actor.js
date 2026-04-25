export function getActorLevel(actor) {
  return Number(actor.system?.details?.level?.value ?? 1);
}


export function getHP(actor) {
  return actor.system.attributes.hp;
}

export function isVitalityActor(actor) {
  if (!actor) return false;
  if (actor.type !== "character") return false;

  const classItem = actor.items?.find((item) => item.type === "class");

  const classSlug = String(
    actor.class?.slug
      ?? classItem?.slug
      ?? classItem?.system?.slug
      ?? classItem?.name
      ?? ""
  ).toLowerCase();

  return classSlug === "mystic";
}