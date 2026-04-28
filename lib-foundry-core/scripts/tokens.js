export class FCoreTokens {
  static getControlled() {
    return canvas.tokens.controlled ?? [];
  }

  static getFirstControlled() {
    return canvas.tokens.controlled[0] ?? null;
  }

  static getTargets() {
    return Array.from(game.user.targets ?? []);
  }

  static getFirstTarget() {
    return this.getTargets()[0] ?? null;
  }

  static hasControlled() {
    return this.getControlled().length > 0;
  }

  static hasTarget() {
    return this.getTargets().length > 0;
  }
}