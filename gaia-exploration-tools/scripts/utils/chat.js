export async function envoyerMessageChat(content, gmOnly = false) {
  const messageData = {
    speaker: ChatMessage.getSpeaker(),
    content
  };

  if (gmOnly) {
    messageData.whisper = game.users
      .filter(user => user.isGM)
      .map(user => user.id);
  }

  await ChatMessage.create(messageData);
}