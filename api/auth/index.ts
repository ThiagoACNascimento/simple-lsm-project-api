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

    patchPassword: async (request, response) => {
      if (!request.session) {
        throw new RouteError(401, "Nao autorizado");
      }

      const { password, newPassword } = request.body;
      const user = this.query.selectUser("id", request.session.user_id);

      if (!user) {
        throw new RouteError(404, "Usuario nao encontrado");
      }

      const validPassword = await this.pass.verify(
        password,
        user.password_hash,
      );

      if (!validPassword) {
        throw new RouteError(400, "Senha incorreta, tente novamente.");
      }

      const newPasswordHashed = await this.pass.hash(newPassword);

      const updatedUser = this.query.updateUser(
        user.id,
        "password_hash",
        newPasswordHashed,
      );

      if (updatedUser.changes === 0) {
        throw new RouteError(400, "Erro ao atualizar senha");
      }

      this.session.invalidateAll(user.id);

      const { cookie } = await this.session.create({
        userId: user.id,
        ip: request.ip,
        ua: request.headers["user-agent"] ?? "",
      });

      response.setCookie(cookie);
      response.status(200).json({ title: "Senha atualizada!" });
    },

    forgotPassword: async (request, response) => {
      const { email } = request.body;
      const user = this.query.selectUser("email", email);

      if (!user) {
        return response.status(200).json({ title: "Verifique seu email" });
      }

      const { token } = await this.session.resetToken({
        userId: user.id,
        ip: request.ip,
        ua: request.headers["user-agent"] || "",
      });

      const resetLink = `${request.baseurl}/password/reset/?token=${token}`;

      const mailContent = {
        to: user.email,
        subject: "Password Reset",
        body: `Utilize o link abaixo para resetar a sua senha: \r\n ${resetLink}`,
      };

      console.log(mailContent);
      response.status(200).json({ title: "Verifique seu emailf" });
    },

    resetPassword: async (request, response) => {
      const { newPassword, token } = request.body;
      const reset = await this.session.validateToken(token);

      if (!reset) {
        throw new RouteError(400, "token invalido");
      }

      const new_password_hash = await this.pass.hash(newPassword);
      const updateResult = this.query.updateUser(
        reset.user_id,
        "password_hash",
        new_password_hash,
      );

      if (updateResult.changes === 0) {
        throw new RouteError(400, "Erro ao atualizar senha");
      }

      response.status(200).json({ title: "Senha atualizada" });
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
    this.router.patch("/auth/password/update", this.handlers.patchPassword, [
      this.auth.guard("user"),
    ]);
    this.router.post("/auth/password/forgot", this.handlers.forgotPassword);
    this.router.post("/auth/password/reset", this.handlers.resetPassword);
    this.router.get("/auth/session", this.handlers.getSession, [
      this.auth.guard("user"),
    ]);
    this.router.delete("/auth/logout", this.handlers.deleteSession);
  }
}
