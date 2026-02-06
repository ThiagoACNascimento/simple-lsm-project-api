import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("./lms.sqlite");

db.exec(/*sql*/ `
    PRAGMA foreign_keys = 1;
    PRAGMA journal_mode = DELETE;
    PRAGMA synchronous = NORMAL;

    PRAGMA cache_size = 2000;
    PRAGMA busy_timeout = 5000;
    PRAGMA temp_store = MEMORY;

    CREATE TABLE IF NOT EXISTS "cursos" (
      "id" INTEGER PRIMARY KEY,
      "slug" TEXT NOT NULL COLLATE NOCASE UNIQUE,
      "nome" TEXT NOT NULL,
      "descricao" TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS "aulas" (
      "id" INTEGER PRIMARY KEY,
      "curso_id" INTEGER NOT NULL,
      "slug" TEXT NOT NULL COLLATE NOCASE,
      "nome" TEXT NOT NULL,
      FOREIGN KEY("curso_id") REFERENCES "cursos" ("id"),
      UNIQUE("curso_id", "slug")
    ) STRICT;`);

export function criarCurso({ slug, nome, descricao }) {
  try {
    return db
      .prepare(
        `
      INSERT OR IGNORE INTO "cursos"
        ("slug", "nome", "descricao")
      VALUES
        (?,?,?)
      ;`,
      )
      .run(slug, nome, descricao);
  } catch (error) {
    return null;
  }
}

export function criarAula({ slug, nome, cursoSlug }) {
  try {
    return db
      .prepare(
        `
      INSERT OR IGNORE INTO "aulas"
        ("slug", "nome", "curso_id")
      VALUES
        (?,?,(SELECT "id" FROM "cursos" WHERE "slug" = ?))
      ;`,
      )
      .run(slug, nome, cursoSlug);
  } catch (error) {
    return null;
  }
}

export function pegarCursos() {
  try {
    return db
      .prepare(
        `
        SELECT 
          *
        FROM
          "cursos"
      ;`,
      )
      .all();
  } catch (error) {
    return null;
  }
}

export function pegarCurso(slug) {
  try {
    return db
      .prepare(
        `
        SELECT 
          *
        FROM
          "cursos"
        WHERE
          "slug" = ?
      ;`,
      )
      .get(slug);
  } catch (error) {
    return null;
  }
}

export function pegarAulas(curso) {
  try {
    return db
      .prepare(
        `
        SELECT 
          *
        FROM
          "aulas"
        WHERE
          "curso_id" = (SELECT "id" FROM "cursos" WHERE "slug" =?)
      ;`,
      )
      .all(curso);
  } catch (error) {
    return null;
  }
}

export function pegarAula(cursoSlug, aulaSlug) {
  try {
    return db
      .prepare(
        `
        SELECT 
          *
        FROM
          "aulas"
        WHERE
          "curso_id" = (SELECT "id" FROM "cursos" WHERE "slug" = ?) 
          AND "slug" = ?
      ;`,
      )
      .get(cursoSlug, aulaSlug);
  } catch (error) {
    return null;
  }
}
