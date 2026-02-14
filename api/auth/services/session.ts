import { CoreProvider } from "../../../core/utils/abstract.ts";
import { AuthQuery } from "../query.ts";
import { randomBytsAsync, sha256 } from "../utils/utils.ts";

const time_to_live_seconds = 60 * 60 * 24 * 15;
const time_to_live_seconds_five_days = 60 * 60 * 24 * 5;

export const COOKIE_SESSION_ID_KEY = "__Secure-session_id";

function cookieGenerate(session_id: string, expires: number) {
  return `${COOKIE_SESSION_ID_KEY}=${session_id}; Path=/; Max-Age=${expires}; HttpOnly; Secure; SameSite=Lax`;
}

export class SessionService extends CoreProvider {
  query = new AuthQuery(this.db);

  async create({ userId, ip, ua }: { userId: number; ip: string; ua: string }) {
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

    const cookie = cookieGenerate(session_id, time_to_live_seconds);

    return { cookie };
  }

  validate(session_id: string) {
    const now = Date.now();

    const session_id_hash = sha256(session_id);

    const session = this.query.selectSession(session_id_hash);

    if (!session || session.revoked === 1) {
      return {
        valid: false,
        cookie: cookieGenerate("", 0),
      };
    }

    let expires_ms = session.expires_ms;

    if (now >= expires_ms) {
      this.query.revokeSession(session_id_hash);
      return {
        valid: false,
        cookie: cookieGenerate("", 0),
      };
    }

    if (now >= expires_ms - 1000 * time_to_live_seconds_five_days) {
      const expires_msUpdate = now + 1000 * time_to_live_seconds;
      this.query.updateSessionExpires(session_id_hash, expires_msUpdate);
      expires_ms = expires_msUpdate;
    }

    const user = this.query.selectUserRole(session.user_id);

    if (!user) {
      this.query.revokeSession(session_id_hash);
      return {
        valid: false,
        cookie: cookieGenerate("", 0),
      };
    }

    return {
      valid: true,
      cookie: cookieGenerate(session_id, Math.floor((expires_ms - now) / 1000)),
      session: {
        user_id: session.user_id,
        role: user.role,
        expires_ms,
      },
    };
  }

  invalidate(session_id: string | undefined) {
    const cookie = cookieGenerate("", 0);
    try {
      if (session_id) {
        const session_id_hash = sha256(session_id);
        this.query.revokeSession(session_id_hash);
      }
    } catch {
    } finally {
      return { cookie };
    }
  }

  invalidateAll(user_id: number) {
    this.query.revokeAllSessions(user_id);
  }
}
