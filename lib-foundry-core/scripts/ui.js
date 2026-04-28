export class FCoreUI {
  static info(message) {
    ui.notifications.info(message);
  }

  static warn(message) {
    ui.notifications.warn(message);
  }

  static error(message) {
    ui.notifications.error(message);
  }

  static renderDialog({ title, content, buttons, defaultButton = null }) {
    return new Dialog({
      title,
      content,
      buttons,
      default: defaultButton
    }).render(true);
  }
}