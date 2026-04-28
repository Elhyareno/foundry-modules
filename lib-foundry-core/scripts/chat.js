export class FCoreChat {
  static getGMIds() {
    return game.users.filter(user => user.isGM).map(user => user.id);
  }

  static async send(content, { gmOnly = false, speaker = ChatMessage.getSpeaker() } = {}) {
    const messageData = { speaker, content };

    if (gmOnly) {
      messageData.whisper = this.getGMIds();
    }

    return ChatMessage.create(messageData);
  }
}