import { run } from "node:test";
import { Query } from "../../core/utils/abstract.ts";

type UserRole = "admin" | "editor" | "user";

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
}
