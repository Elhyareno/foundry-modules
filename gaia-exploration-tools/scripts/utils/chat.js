export async function envoyerMessageChat(content) {
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content
  });
}