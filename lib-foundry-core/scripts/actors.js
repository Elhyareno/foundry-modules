export class FCoreActors {
  static getControlledActor() {
    return canvas.tokens.controlled[0]?.actor ?? null;
  }

  static getControlledActors() {
    return canvas.tokens.controlled
      .map(token => token.actor)
      .filter(Boolean);
  }

  static getActorFromToken(token) {
    return token?.actor ?? null;
  }

  static getActorById(actorId) {
    return game.actors.get(actorId) ?? null;
  }
}