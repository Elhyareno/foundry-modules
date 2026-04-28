export class FCoreTime {
  static getWorldTime() {
    return game.time.worldTime;
  }

  static getDateLabel() {
    const date = new Date();

    return date.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  static getSlugDate() {
    const date = new Date();

    return date
      .toISOString()
      .replace("T", "_")
      .replaceAll(":", "-")
      .slice(0, 16);
  }
}