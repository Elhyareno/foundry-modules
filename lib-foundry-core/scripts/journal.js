export class FCoreJournal {
  static async getOrCreate(name) {
    let journal = game.journal.getName(name);

    if (!journal) {
      journal = await JournalEntry.create({ name });
    }

    return journal;
  }

  static async addTextPage(journal, { name, content }) {
    return JournalEntryPage.create({
      name,
      type: "text",
      text: { content }
    }, { parent: journal });
  }

  static async addTextPageToJournal(journalName, { name, content }) {
    const journal = await this.getOrCreate(journalName);
    return this.addTextPage(journal, { name, content });
  }
}