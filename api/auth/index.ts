import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { AuthQuery } from "./query.ts";
import { COOKIE_SESSION_ID_KEY, SessionService } from "./services/session.ts";
import { authTables } from "./tables.ts";

export class AuthApi extends Api {
  query = new AuthQuery(this.db);
  session = new SessionService(this.core);
  handlers = {
    postUser: (request, response) => {
      const { name, username, email, password } = request.body;
      const password_hash = password;
      const writeResult = this.query.insertUser({
        name,
        username,
        email,
        role: "user",
        password_hash,
      });

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro na criacao de usuario");
      }

      response.status(201).json({ title: "Usuario criado" });
    },

    postLogin: async (request, response) => {
      const { email, password } = request.body;
      const user = this.db
        .query(
          /*sql*/
          `
            SELECT 
              "id", "password_hash"
            FROM 
              "users"
            WHERE 
              "email" = ?
        ;`,
        )
        .get(email);
      if (!user || password !== user.password_hash) {
        throw new RouteError(404, "Credenciais invalidas, tente novamente.");
      }

      const { cookie } = await this.session.create({
        userId: user.id,
        ip: request.ip,
        ua: request.headers["user-agent"] ?? "",
      });

      response.setCookie(cookie);
      response.status(200).json({ title: "autenticado" });
    },

    getSession: (request, response) => {
      const session_id = request.cookies[COOKIE_SESSION_ID_KEY];

      if (!session_id) {
        throw new RouteError(401, "Nao autorizado");
      }

      const { valid, cookie, session } = this.session.validate(session_id);
      response.setCookie(cookie);

      if (!valid || !session) {
        throw new RouteError(401, "Nao autorizado");
      }

      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Vary", "Cookie");
      response.status(200).json(session);
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(authTables);
  }

  routes(): void {
    this.router.post("/auth/user", this.handlers.postUser);
    this.router.post("/auth/login", this.handlers.postLogin);
    this.router.get("/auth/session", this.handlers.getSession);
  }
}
