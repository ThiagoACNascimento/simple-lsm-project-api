import { CoreProvider } from "../../../core/utils/abstract.ts";
import { AuthQuery } from "../query.ts";
import { randomBytsAsync, sha256 } from "../utils.ts";

const time_to_live_seconds = 60 * 60 * 24 * 15;

export class SessionService extends CoreProvider {
  query = new AuthQuery(this.db);

  async create({ userId, ip, ua }) {
    const session_id = (await randomBytsAsync(32)).toString("base64url");
    const session_id_hash = sha256(session_id);

    const expires_ms = Date.now() + time_to_live_seconds * 1000;

    this.query.insertSession({
      session_id_hash,
      user_id: userId,
      expires_ms,
      ip,
      ua,
    });

    const cookie = `__Secure-session_id=${session_id}; Path=/; Max-Age=${time_to_live_seconds}; HttpOnly; Secure; SameSite=Lax`;

    return { cookie };
  }
}
