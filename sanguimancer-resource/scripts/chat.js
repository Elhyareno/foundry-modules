/**
 * Post a message to chat
 */
export function postToChat(actor, msg) {
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<strong>Sanguimancie</strong><br>${msg}`
  });
}
