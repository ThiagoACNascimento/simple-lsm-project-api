import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { lmsTables } from "./tables.ts";

export class LmsApi extends Api {
  handlers = {
    postCourses: (request, response) => {
      const { slug, title, description, lessons, hours } = request.body;
      const writeResult = this.db
        .query(
          /*sql*/ `
          INSERT OR IGNORE INTO "courses"
            ("slug", "title", "description", "lessons", "hours")
          VALUES 
            (?,?,?,?,?)
      ;`,
        )
        .run(slug, title, description, lessons, hours);
      console.log(writeResult);
      if (!writeResult.changes) {
        throw new RouteError(400, "Erro ao criar curso.");
      }

      response.status(201).json({
        id: writeResult.lastInsertRowid,
        changes: writeResult.changes,
        title: "Curso criado!",
      });
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(lmsTables);
  }

  routes(): void {
    this.router.post("/lms/courses", this.handlers.postCourses);
  }
}
