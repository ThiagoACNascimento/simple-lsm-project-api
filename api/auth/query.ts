import { run } from "node:test";
import { Query } from "../../core/utils/abstract.ts";

export type UserRole = "admin" | "editor" | "user";

type UserData = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  password_hash: string;
  created: string;
  updated: string;
};

type SessionData = {
  session_id: Buffer;
  user_id: number;
  created: number;
  expires: number;
  ip: string;
  ua: string;
  revoked: number; // 0 ou 1
};

type UserCreate = Omit<UserData, "id" | "created" | "updated">;
type SessionCreate = Omit<
  SessionData,
  "session_id" | "created" | "revoked" | "expires" | "session_id"
> & {
  expires_ms: number;
  session_id_hash: Buffer;
};

export class AuthQuery extends Query {
  insertUser({ name, username, email, role, password_hash }: UserCreate) {
    return this.db
      .query(
        /*sql*/
        `
        INSERT OR IGNORE INTO "users"
          ("name", "username", "email", "role", "password_hash")
        VALUES
          (?,?,?,?,?)
      ;`,
      )
      .run(name, username, email, role, password_hash);
  }

  selectUser(key: "email" | "username" | "id", value: string | number) {
    return this.db
      .query(
        /*sql*/
        `
            SELECT 
              "id", "password_hash"
            FROM 
              "users"
            WHERE 
              ${key} = ?
        ;`,
      )
      .get(value) as { id: number; password_hash: string } | undefined;
  }

  updateUser(
    user_id: number,
    key: "email" | "password_hash" | "username" | "name",
    value: string,
  ) {
    return this.db
      .query(
        /*sql*/
        `
            UPDATE 
              "users"
            SET 
              ${key} = ?
            WHERE 
              "id" = ?
        ;`,
      )
      .run(value, user_id);
  }

  insertSession({
    session_id_hash,
    user_id,
    expires_ms,
    ip,
    ua,
  }: SessionCreate) {
    return this.db
      .query(
        /*sql*/
        `
        INSERT OR IGNORE INTO "sessions"
          ("session_id", "user_id", "expires", "ip", "ua")
        VALUES
          (?,?,?,?,?)
      ;`,
      )
      .run(session_id_hash, user_id, Math.floor(expires_ms / 1000), ip, ua);
  }

  selectSession(session_id_hash: Buffer) {
    return this.db
      .query(
        /*sql*/
        `
          SELECT 
            "s".*, 
            "s"."expires" * 1000 as "expires_ms"
          FROM 
            "sessions" as "s"
          WHERE 
            "session_id" = ?
      ;`,
      )
      .get(session_id_hash) as
      | (SessionData & { expires_ms: number })
      | undefined;
  }

  revokeSession(session_id_hash: Buffer) {
    return this.db
      .query(
        /*sql*/
        `
          UPDATE
            "sessions"
          SET 
            "revoked" = 1 
          WHERE
            "session_id" = ?
      ;`,
      )
      .run(session_id_hash);
  }

  revokeAllSessions(userId: number) {
    return this.db
      .query(
        /*sql*/
        `
          UPDATE
            "sessions"
          SET
            "revoked" = 1
          WHERE
            "user_id" = ?
      ;`,
      )
      .run(userId);
  }

  updateSessionExpires(session_id_hash: Buffer, expires_msUpdate: number) {
    return this.db
      .query(
        /*sql*/
        `
          UPDATE
            "sessions"
          SET 
            "expires" = ?
          WHERE
            "session_id" = ?
      ;`,
      )
      .run(Math.floor(expires_msUpdate / 1000), session_id_hash);
  }

  selectUserRole(user_id: number) {
    return this.db
      .query(
        /*sql*/
        `
          SELECT
            "role"
          FROM
            "users"
          WHERE
            "id" = ?
      ;`,
      )
      .get(user_id) as { role: UserRole } | undefined;
  }
}
