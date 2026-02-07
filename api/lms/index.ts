import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { LmsQuery } from "./query.ts";
import { lmsTables } from "./tables.ts";

export class LmsApi extends Api {
  query = new LmsQuery(this.db);

  handlers = {
    postCourse: (request, response) => {
      const { slug, title, description, lessons, hours } = request.body;
      const writeResult = this.query.insertCourse({
        slug,
        title,
        description,
        lessons,
        hours,
      });

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro ao criar curso.");
      }

      response.status(201).json({
        id: writeResult.lastInsertRowid,
        changes: writeResult.changes,
        title: "Curso criado!",
      });
    },

    postLesson: (request, response) => {
      const {
        courseSlug,
        slug,
        title,
        seconds,
        video,
        description,
        order,
        free,
      } = request.body;
      const writeResult = this.db
        .query(
          /*sql*/ `
          INSERT OR IGNORE INTO "lessons"
            (
              "course_id", "slug", 
              "title", "seconds", 
              "video", "description", 
              "order", "free"
            )
          VALUES 
            (
              (SELECT "id" FROM "courses" WHERE "slug" = ?),
              ?,?,?,?,?,?,?
            )
      ;`,
        )
        .run(courseSlug, slug, title, seconds, video, description, order, free);
      if (!writeResult.changes) {
        throw new RouteError(400, "Erro ao criar aula.");
      }

      response.status(201).json({
        id: writeResult.lastInsertRowid,
        changes: writeResult.changes,
        title: "Aula criado!",
      });
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(lmsTables);
  }

  routes(): void {
    this.router.post("/lms/course", this.handlers.postCourse);
    this.router.post("/lms/lesson", this.handlers.postLesson);
  }
}
