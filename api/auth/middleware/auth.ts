import type { Middleware } from "../../../core/router.ts";
import { CoreProvider } from "../../../core/utils/abstract.ts";
import { RouteError } from "../../../core/utils/route-error.ts";
import type { UserRole } from "../query.ts";
import { COOKIE_SESSION_ID_KEY, SessionService } from "../services/session.ts";

function roleCheck(requiredRole: UserRole, userRole: UserRole): boolean {
  switch (userRole) {
    case "admin":
      return true;
    case "editor":
      return requiredRole === "editor" || requiredRole === "user";
    case "user":
      return requiredRole === "user";
    default:
      return false;
  }
}

export class AuthMiddleware extends CoreProvider {
  session = new SessionService(this.core);

  guard =
    (role: UserRole): Middleware =>
    async (request, response) => {
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Vary", "Cookie");

      const session_id = request.cookies[COOKIE_SESSION_ID_KEY];

      if (!session_id) {
        throw new RouteError(401, "Nao autorizado");
      }

      const { valid, cookie, session } = this.session.validate(session_id);
      response.setCookie(cookie);

      if (!valid || !session) {
        throw new RouteError(401, "Nao autorizado");
      }

      if (!roleCheck(role, session.role)) {
        throw new RouteError(403, "Sem permissao");
      }

      request.session = session;
    };

  optional: Middleware = async (request, response) => {
    const session_id = request.cookies[COOKIE_SESSION_ID_KEY];

    if (!session_id) {
      return;
    }

    const { valid, cookie, session } = this.session.validate(session_id);
    response.setCookie(cookie);

    if (!valid || !session) {
      return;
    }

    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("Vary", "Cookie");

    request.session = session;
  };
}
