export class FCoreChat {
  static getGMIds() {
    return game.users.filter(user => user.isGM).map(user => user.id);
  }

  static getSpeaker(actor = null) {
    return actor
      ? ChatMessage.getSpeaker({ actor })
      : ChatMessage.getSpeaker();
  }

  static async send(content, { gmOnly = false, actor = null, whisper = null } = {}) {
    const messageData = {
      speaker: this.getSpeaker(actor),
      content
    };

    if (gmOnly) {
      messageData.whisper = this.getGMIds();
    }

    if (whisper) {
      messageData.whisper = whisper;
    }

    return ChatMessage.create(messageData);
  }
}