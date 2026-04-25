const MODULE_ID = "pf2e-hero-stats";

/**
 * Format a number as a percentage with specified decimal places
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
  return (value * 100).toFixed(decimals) + "%";
}

/**
 * Get the formatted date string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Check if a user is a GM
 * @param {User} user - The user to check
 * @returns {boolean} True if user is a GM
 */
export function isGM(user = game.user) {
  return user?.isGM || false;
}

/**
 * Send a message to chat
 * @param {string} content - The content to send
 * @param {boolean} gmOnly - Whether to send only to GMs
 */
export async function sendChatMessage(content, gmOnly = false) {
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

/**
 * Get all active combats
 * @returns {Combat[]} Array of active combats
 */
export function getActiveCombats() {
  return game.combats.filter(combat => !combat.isEnded);
}

/**
 * Get current combat if in combat
 * @returns {Combat|null} Current combat or null
 */
export function getCurrentCombat() {
  return game.combat && !game.combat.isEnded ? game.combat : null;
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
