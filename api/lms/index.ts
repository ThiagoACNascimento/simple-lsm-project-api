import { title } from "node:process";
import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { LmsQuery } from "./query.ts";
import { lmsTables } from "./tables.ts";
import { getCACertificates } from "node:tls";
import { AuthMiddleware } from "../auth/middleware/auth.ts";

export class LmsApi extends Api {
  query = new LmsQuery(this.db);
  auth = new AuthMiddleware(this.core);

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

    getCourses: (request, response) => {
      const courses = this.query.selectCourses();

      if (courses.length === 0) {
        throw new RouteError(404, "Nenhum curso encontrado");
      }

      response.status(200).json(courses);
    },

    getCourse: (request, response) => {
      const { slug } = request.params;
      const course = this.query.selectCourse(slug);
      const lessons = this.query.selectLessons(slug);

      if (!course) {
        throw new RouteError(404, "Nenhum curso encontrado");
      }

      let completed: {
        lesson_id: number;
        completed: string;
      }[] = [];

      if (request.session) {
        completed = this.query.selectLessonsCompleted(
          request.session.user_id,
          course.id,
        );
      }

      response.status(200).json({ course, lessons, completed });
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
      const writeResult = this.query.insertLesson({
        courseSlug,
        slug,
        title,
        seconds,
        video,
        description,
        order,
        free,
      });
      if (!writeResult.changes) {
        throw new RouteError(400, "Erro ao criar aula.");
      }

      response.status(201).json({
        id: writeResult.lastInsertRowid,
        changes: writeResult.changes,
        title: "Aula criado!",
      });
    },

    postCompletedLesson: (request, response) => {
      const userId = 1;
      const { courseId, lessonId } = request.body;

      const writeResult = this.query.insertLessonCompleted(
        userId,
        courseId,
        lessonId,
      );

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro ao completar aula.");
      }

      const progress = this.query.selectProgress(userId, courseId);
      const incompliteLessons = progress.filter((item) => !item.completed);
      if (progress.length > 0 && incompliteLessons.length === 0) {
        const result = this.query.insertCertificate(userId, courseId);

        if (!result) {
          throw new RouteError(400, "Erro ao gerar certificado");
        }

        response.status(201).json({
          title: "Aula completada.",
          certificate: result.id,
        });
      }

      response.status(201).json({
        title: "Aula completada.",
        certificate: null,
      });
      return;
    },

    getLesson: (request, response) => {
      const { courseSlug, lessonSlug } = request.params;
      const lesson = this.query.selectLesson(courseSlug, lessonSlug);
      const nav = this.query.selectLessonNav(courseSlug, lessonSlug);

      if (!lesson) {
        throw new RouteError(404, "Aula nao encontrada");
      }

      const indexLessonNav = nav.findIndex(
        (lessonNav) => lessonNav.slug === lesson.slug,
      );
      const indexPrev =
        indexLessonNav === 0 ? null : nav.at(indexLessonNav - 1)?.slug;
      const indexNext = nav.at(indexLessonNav + 1)?.slug ?? null;

      const userId = 1;
      let completed = "";
      if (userId) {
        const lessonCompleted = this.query.selectLessonCompleted(
          userId,
          lesson.id,
        );
        if (lessonCompleted) {
          completed = lessonCompleted.completed;
        }
      }

      response.status(200).json({ ...lesson, indexPrev, indexNext, completed });
    },

    resetCourse: (request, response) => {
      const userId = 1;
      const { courseId } = request.body;
      const writeResult = this.query.deleteLessonsCopleted(userId, courseId);

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro no reset do curso");
      }

      response.status(200).json({
        title: "Curso resetado.",
      });
    },

    getCertificates: (request, response) => {
      const userId = 1;
      const certificates = this.query.selectCertificates(userId);

      if (certificates.length === 0) {
        throw new RouteError(400, "Nenhum certificado encontrado!");
      }

      response.status(200).json(certificates);
    },

    getCertificate: (request, response) => {
      const { certificateId } = request.params;
      const certificate = this.query.selectCertificate(certificateId);

      if (!certificate) {
        throw new RouteError(400, "Certificado nao encontrado!");
      }

      response.status(200).json(certificate);
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(lmsTables);
  }

  routes(): void {
    this.router.post("/lms/course", this.handlers.postCourse);
    this.router.get("/lms/courses", this.handlers.getCourses);
    this.router.get("/lms/course/:slug", this.handlers.getCourse, [
      this.auth.optional,
    ]);
    this.router.delete("/lms/course/reset", this.handlers.resetCourse);
    this.router.post("/lms/lesson", this.handlers.postLesson);
    this.router.get(
      "/lms/lesson/:courseSlug/:lessonSlug",
      this.handlers.getLesson,
    );
    this.router.post("/lms/lesson/complete", this.handlers.postCompletedLesson);
    this.router.get("/lms/certificates", this.handlers.getCertificates);
    this.router.get("/lms/certificates/:id", this.handlers.getCertificate);
  }
}
