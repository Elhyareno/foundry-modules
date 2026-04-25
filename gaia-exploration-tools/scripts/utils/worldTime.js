export function getWorldTimeLabel() {
  const components = game.time.components;

  if (!components) {
    return `Temps monde : ${game.time.worldTime}`;
  }

  const day = components.day ?? "?";
  const month = components.month ?? "?";
  const year = components.year ?? "?";
  const hour = components.hour ?? 0;
  const minute = components.minute ?? 0;

  return `Jour : ${day}, mois : ${month}, année ${year}, ${hour}h${String(minute).padStart(2, "0")}`;
}