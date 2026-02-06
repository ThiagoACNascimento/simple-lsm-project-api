import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("./lms.sqlite");

export class Database extends DatabaseSync {
  constructor(path: string) {
    super(path);
    this.exec(`
      PRAGMA foreign_keys = 1;
      PRAGMA journal_mode = DELETE;
      PRAGMA synchronous = NORMAL;

      PRAGMA cache_size = 2000;
      PRAGMA busy_timeout = 5000;
      PRAGMA temp_store = MEMORY;
    `);
  }
}
