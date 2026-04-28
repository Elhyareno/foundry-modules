export class PF2eResources {
  static get(actor, path) {
    return foundry.utils.getProperty(actor, path);
  }

  static async set(actor, path, value) {
    return actor.update({
      [path]: value
    });
  }

  static getFlagResource(actor, scope, key, fallback = {}) {
    return actor?.getFlag(scope, key) ?? fallback;
  }

  static async setFlagResource(actor, scope, key, value) {
    return actor.setFlag(scope, key, value);
  }

  static clamp(value, min, max) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return min;

    return Math.max(min, Math.min(numericValue, max));
  }
}