import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { AuthQuery } from "./query.ts";
import { authTables } from "./tables.ts";

export class AuthApi extends Api {
  query = new AuthQuery(this.db);

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
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(authTables);
  }

  routes(): void {
    this.router.post("/auth/user", this.handlers.postUser);
  }
}
