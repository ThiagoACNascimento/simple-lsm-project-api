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
      if (!writeResult.changes) {
        throw new RouteError(400, "Erro ao criar curso.");
      }

      response.status(201).json({
        id: writeResult.lastInsertRowid,
        changes: writeResult.changes,
        title: "Curso criado!",
      });
    },

    postLessons: (request, response) => {
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
    this.router.post("/lms/courses", this.handlers.postCourses);
    this.router.post("/lms/lessons", this.handlers.postLessons);
  }
}
