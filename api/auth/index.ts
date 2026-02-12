import { title } from "node:process";
import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { AuthMiddleware } from "./middleware/auth.ts";
import { AuthQuery } from "./query.ts";
import { COOKIE_SESSION_ID_KEY, SessionService } from "./services/session.ts";
import { authTables } from "./tables.ts";
import { Password } from "./utils/password.ts";

export class AuthApi extends Api {
  query = new AuthQuery(this.db);
  session = new SessionService(this.core);
  auth = new AuthMiddleware(this.core);
  pass = new Password("segredo");

  handlers = {
    postUser: async (request, response) => {
      const { name, username, email, password } = request.body;

      const emailExists = this.query.selectUser("email", email);

      if (emailExists) {
        throw new RouteError(409, "Email ja existe");
      }

      const userNameExists = this.query.selectUser("username", username);

      if (userNameExists) {
        throw new RouteError(409, "Username ja existe");
      }

      const password_hash = await this.pass.hash(password);
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
      const user = this.query.selectUser("email", email);
      if (!user) {
        throw new RouteError(404, "Credenciais invalidas, tente novamente.");
      }

      const validPassword = await this.pass.verify(
        password,
        user.password_hash,
      );
      if (!validPassword) {
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
      if (!request.session) {
        throw new RouteError(401, "Nao autorizado");
      }

      response.status(200).json({ title: "valida" });
    },

    deleteSession: (request, response) => {
      const session_id = request.cookies[COOKIE_SESSION_ID_KEY];
      const { cookie } = this.session.invalidate(session_id);

      response.setCookie(cookie);
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Vary", "Cookie");

      response.status(204).json({ title: "logout" });
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(authTables);
  }

  routes(): void {
    this.router.post("/auth/user", this.handlers.postUser);
    this.router.post("/auth/login", this.handlers.postLogin);
    this.router.get("/auth/session", this.handlers.getSession, [
      this.auth.guard("user"),
    ]);
    this.router.delete("/auth/logout", this.handlers.deleteSession);
  }
}
