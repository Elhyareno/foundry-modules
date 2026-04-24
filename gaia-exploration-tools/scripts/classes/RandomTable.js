export class RandomTable {
  constructor(name, entries = []) {
    this.name = name;
    this.entries = entries;
  }

  roll() {
    if (this.entries.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * this.entries.length);
    return this.entries[index];
  }
}