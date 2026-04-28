export class FCoreSettings {
  static register(moduleId, key, options) {
    game.settings.register(moduleId, key, options);
  }

  static get(moduleId, key, fallback = null) {
    return game.settings.get(moduleId, key) ?? fallback;
  }

  static async set(moduleId, key, value) {
    return game.settings.set(moduleId, key, value);
  }

  static registerObject(moduleId, key, name, defaultValue = {}) {
    this.register(moduleId, key, {
      name,
      scope: "world",
      config: false,
      type: Object,
      default: defaultValue
    });
  }
}